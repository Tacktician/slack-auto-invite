resource "random_string" "random_suffix" {
  length  = "4"
  upper   = false
  special = false
}

locals {
  auto-invite = {
    project = var.project_id
    name    = "slack-auto-invite-${var.environment}-${random_string.random_suffix.result}"
    env     = var.environment
    region  = var.function_region
    zone    = var.function_zone
  }
}

# Store tf state file in gcs bucket
resource "google_storage_bucket" "backend" {
  name          = "${local.auto-invite.name}-bucket-tfstate"
  force_destroy = false
  location      = "US"
  storage_class = "STANDARD"
  versioning {
    enabled = true
  }
}

# Zip up /src directory
data "archive_file" "source" {
  type        = "zip"
  source_dir  = "../src/"
  output_path = "/tmp/${local.auto-invite.name}.zip"
  excludes = [
    ".eslintrc.json",
    "index.test.js",
    "node_modules"
  ]
}

# Store .zip source file in gcs bucket
resource "google_storage_bucket_object" "function-source" {
  name   = "terraform-function.zip#${data.archive_file.source.output_md5}"
  bucket = google_storage_bucket.slack-auto-invite-gcf.name
  source = data.archive_file.source.output_path
  depends_on = [
    data.archive_file.source
  ]
}

# Store unzipped src code in gcs bucket
resource "google_storage_bucket" "slack-auto-invite-gcf" {
  name                        = "${local.auto-invite.name}-bucket"
  location                    = var.function_location
  uniform_bucket_level_access = true
  project                     = local.auto-invite.project
}

# Slack Auto-Invite Google Cloud Function
resource "google_cloudfunctions_function" "slack-auto-invite-function" {
  name        = "${local.auto-invite.name}-function"
  description = "slack auto invite google cloud function"
  project     = local.auto-invite.project
  region      = var.function_region
  runtime     = "nodejs18"

  available_memory_mb   = 128
  source_archive_bucket = google_storage_bucket.slack-auto-invite-gcf.name
  source_archive_object = google_storage_bucket_object.function-source.name
  trigger_http          = true
  entry_point           = "sendInvite"
  environment_variables = {
    SLACK_USER_TOKEN      = var.slack_token
    SLACK_MESSAGE_CHANNEL = var.message_channel
    SLACK_CHANNEL_IDS     = var.channel_ids
    SLACK_TEAM_ID         = var.team_id
    BEARER_TOKEN          = var.auth_token
  }
}

# IAM entry for all users to invoke the function
resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = google_cloudfunctions_function.slack-auto-invite-function.project
  region         = google_cloudfunctions_function.slack-auto-invite-function.region
  cloud_function = google_cloudfunctions_function.slack-auto-invite-function.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}

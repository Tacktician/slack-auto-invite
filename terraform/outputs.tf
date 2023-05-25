output "credentials_path" {
  description = "Path of Google Service Account JSON"
  value       = "Using Google service account JSON file located in ${var.google_credentials}"
}

output "google_storage_bucket_object" {
  value = "Function Source Bucket Name: ${google_storage_bucket_object.function-source.name}"
}

output "function_url" {
  description = "URL of the Cloud Function"
  value       = "Cloud Function URL: ${google_cloudfunctions_function.slack-auto-invite-function.https_trigger_url}"
}

output "function_name" {
  description = "Name of the Cloud Function"
  value       = "Cloud Function Name: ${google_cloudfunctions_function.slack-auto-invite-function.name}"
}

output "function_location" {
  description = "Location of the Cloud Function"
  value       = "Cloud Function Location: ${var.function_location}"
}

output "project_id" {
  value       = "Using Project ID: ${var.project_id}"
  description = "The project ID"
}

output "terraform_state" {
  value       = "TF State Bucket Name: ${google_storage_bucket.backend.name}"
  description = "Name of tfstate gcs bucket"
}
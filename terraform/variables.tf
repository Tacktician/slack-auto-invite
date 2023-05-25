variable "project_id" {
  description = "The ID of the project in which to provision resources."
  type        = string
}

variable "google_credentials" {
  description = "Google Account Service Key Credentials"
  type        = string
}

variable "function_location" {
  description = "The location of this cloud function"
  type        = string
  default     = "US"
}

variable "environment" {
  description = "Deployment environment, expected values: 'd', 's', or 'p'."
  type        = string
  default     = "s"
}

variable "function_region" {
  description = "Deployment region for function"
  type        = string
  default     = "us-central1"
}

variable "function_zone" {
  description = "Deployment zone for function"
  type        = string
  default     = "us-central1-c"
}

variable "slack_token" {
  description = "Slack Bot Token to invoke API calls"
  type        = string
}

variable "auth_token" {
  description = "Marketo auth token"
  type        = string
  default     = "example-key"
}

variable "message_channel" {
  description = "Slack channel to post messages"
  type        = string
}

variable "channel_ids" {
  description = "Slack Channel IDs to give user's initial access, separated by commas"
  type        = string
}

variable "team_id" {
  description = "Slack ID of the workspace to add the user"
  type        = string
}

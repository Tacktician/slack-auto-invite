terraform {
  backend "gcs" {
    bucket = "slack-auto-invite-s-0x0u-bucket-tfstate"
    prefix = "terraform/state"
  }
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "< 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "< 5.0"
    }
  }
  required_version = ">= 0.13"
}

provider "google" {
  credentials = var.google_credentials
  project     = local.auto-invite.project
  region      = local.auto-invite.region
  zone        = local.auto-invite.zone
}
defmodule Klix.Uploads.FileUpload do
  use Klix.Schema

  schema "file_uploads" do
    field :entity_id, :binary_id
    field :upload_type, :string
    field :file_name, :string
    field :key, :string
    field :url, :string
    field :byte_size, :integer
    field :mime_type, :string

    belongs_to :uploader, Klix.Accounts.User

    timestamps(updated_at: false)
  end
end

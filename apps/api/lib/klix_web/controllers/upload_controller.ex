defmodule KlixWeb.UploadController do
  use KlixWeb, :controller

  alias Klix.Uploads
  alias KlixWeb.JSON

  def create(conn, params) do
    with {:ok, file} <- Uploads.store(current_user(conn), params["file"], params["upload_type"], params["entity_id"]) do
      conn |> put_status(201) |> json(JSON.file_upload(file))
    end
  end

  def mine(conn, params) do
    json(conn, Enum.map(Uploads.list_for_user(current_user(conn), params), &JSON.file_upload/1))
  end

  def show(conn, %{"id" => id}) do
    case Uploads.get(id) do
      nil -> {:error, {:not_found, "File not found"}}
      file -> json(conn, JSON.file_upload(file))
    end
  end

  def delete(conn, %{"id" => id}) do
    user = current_user(conn)

    with %{} = file <- Uploads.get(id),
         true <- file.uploader_id == user.id or user.role == "admin" || {:error, :forbidden},
         {:ok, _} <- Uploads.delete(file) do
      json(conn, %{success: true, message: "File deleted"})
    end
  end
end

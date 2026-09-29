defmodule Klix.Uploads do
  @moduledoc "Image uploads for event banners, logos and profile pictures."

  import Ecto.Query
  alias Klix.Repo
  alias Klix.Accounts.User
  alias Klix.Uploads.FileUpload

  @max_bytes 5 * 1024 * 1024
  @types ~w(event_banner event_portrait event_gallery organizer_logo profile_image)

  def max_bytes, do: @max_bytes
  def storage, do: Keyword.get(Application.get_env(:klix, __MODULE__, []), :storage, Klix.Uploads.LocalStorage)

  @doc "Stores an uploaded image. `upload` is a `Plug.Upload`."
  def store(%User{} = user, %Plug.Upload{} = upload, upload_type, entity_id \\ nil) do
    with :ok <- validate_type(upload_type),
         {:ok, body} <- File.read(upload.path),
         :ok <- validate_size(body),
         {:ok, mime, ext} <- sniff(body) do
      now = DateTime.utc_now()
      key = "#{upload_type}/#{now.year}/#{pad(now.month)}/#{Ecto.UUID.generate()}.#{ext}"

      with {:ok, url} <- storage().put(key, body, mime) do
        Repo.insert(%FileUpload{
          uploader_id: user.id,
          entity_id: cast_id(entity_id),
          upload_type: upload_type,
          file_name: String.slice(upload.filename || "upload.#{ext}", 0, 200),
          key: key,
          url: url,
          byte_size: byte_size(body),
          mime_type: mime
        })
      else
        {:error, _} -> {:error, {:payment_provider, "Could not store the file, please try again"}}
      end
    end
  end

  def store(_user, _upload, _type, _entity), do: {:error, {:validation, "Attach an image as `file`"}}

  defp validate_type(type) when type in @types, do: :ok
  defp validate_type(_), do: {:error, {:validation, "upload_type must be one of: #{Enum.join(@types, ", ")}"}}

  defp validate_size(body) when byte_size(body) <= @max_bytes, do: :ok
  defp validate_size(_), do: {:error, {:validation, "Images must be 5 MB or smaller"}}

  # Trust the bytes, not the client's content type.
  defp sniff(<<0xFF, 0xD8, 0xFF, _::binary>>), do: {:ok, "image/jpeg", "jpg"}
  defp sniff(<<0x89, "PNG", 0x0D, 0x0A, 0x1A, 0x0A, _::binary>>), do: {:ok, "image/png", "png"}
  defp sniff(<<"RIFF", _::binary-size(4), "WEBP", _::binary>>), do: {:ok, "image/webp", "webp"}
  defp sniff(_), do: {:error, {:validation, "Only JPEG, PNG and WebP images are supported"}}

  defp pad(n), do: n |> Integer.to_string() |> String.pad_leading(2, "0")

  defp cast_id(nil), do: nil

  defp cast_id(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} -> id
      :error -> nil
    end
  end

  def list_for_user(%User{id: user_id}, params) do
    limit =
      case Integer.parse(to_string(params["limit"] || "50")) do
        {n, _} when n > 0 -> min(n, 200)
        _ -> 50
      end

    from(f in FileUpload, where: f.uploader_id == ^user_id, order_by: [desc: f.inserted_at], limit: ^limit)
    |> then(fn q ->
      case params["upload_type"] do
        t when t in [nil, ""] -> q
        t -> where(q, [f], f.upload_type == ^t)
      end
    end)
    |> Repo.all()
  end

  def get(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} -> Repo.get(FileUpload, id)
      :error -> nil
    end
  end

  def delete(%FileUpload{} = file) do
    _ = storage().delete(file.key)
    Repo.delete(file)
  end
end

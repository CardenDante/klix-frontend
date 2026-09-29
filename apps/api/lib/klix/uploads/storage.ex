defmodule Klix.Uploads.Storage do
  @moduledoc "Where uploaded files live."
  @callback put(key :: String.t(), body :: binary(), content_type :: String.t()) :: {:ok, url :: String.t()} | {:error, term()}
  @callback delete(key :: String.t()) :: :ok | {:error, term()}
end

defmodule Klix.Uploads.LocalStorage do
  @moduledoc "Stores files on local disk, served by the endpoint at /uploads. For development."
  @behaviour Klix.Uploads.Storage

  def root, do: Application.app_dir(:klix, "priv/uploads")

  @impl true
  def put(key, body, _content_type) do
    path = Path.join(root(), key)

    with :ok <- File.mkdir_p(Path.dirname(path)),
         :ok <- File.write(path, body) do
      {:ok, KlixWeb.Endpoint.url() <> "/uploads/" <> key}
    end
  end

  @impl true
  def delete(key) do
    case File.rm(Path.join(root(), key)) do
      :ok -> :ok
      {:error, :enoent} -> :ok
      error -> error
    end
  end
end

defmodule Klix.Uploads.S3Storage do
  @moduledoc """
  Stores files in an S3-compatible bucket (AWS S3, Cloudflare R2,
  DigitalOcean Spaces, MinIO), signed with AWS Signature V4.
  """
  @behaviour Klix.Uploads.Storage

  defp config, do: Application.fetch_env!(:klix, Klix.Uploads)[:s3]

  @impl true
  def put(key, body, content_type) do
    c = config()

    case Req.put(object_url(c, key),
           body: body,
           headers: [{"content-type", content_type}, {"cache-control", "public, max-age=31536000, immutable"}],
           aws_sigv4: sigv4(c),
           receive_timeout: 30_000
         ) do
      {:ok, %{status: status}} when status in 200..299 -> {:ok, public_url(c, key)}
      {:ok, %{status: status, body: body}} -> {:error, {:http, status, body}}
      {:error, reason} -> {:error, reason}
    end
  end

  @impl true
  def delete(key) do
    c = config()

    case Req.delete(object_url(c, key), aws_sigv4: sigv4(c)) do
      {:ok, %{status: status}} when status in 200..299 or status == 404 -> :ok
      {:ok, %{status: status}} -> {:error, {:http, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp sigv4(c) do
    [access_key_id: c[:access_key_id], secret_access_key: c[:secret_access_key], service: :s3, region: c[:region]]
  end

  # Path-style URLs work across providers.
  defp object_url(c, key), do: "#{String.trim_trailing(c[:endpoint], "/")}/#{c[:bucket]}/#{key}"

  defp public_url(c, key) do
    case c[:public_url] do
      nil -> object_url(c, key)
      base -> "#{String.trim_trailing(base, "/")}/#{key}"
    end
  end
end

defmodule Klix.Vault do
  @moduledoc """
  Authenticated encryption (AES-256-GCM) for secrets stored in the
  database, such as organizers' M-Pesa API credentials.

  Ciphertext layout: <<version::8, iv::96, tag::128, ciphertext::binary>>.
  """

  @version 1
  @aad "klix.vault.v1"

  def encrypt(plaintext) when is_binary(plaintext) do
    iv = :crypto.strong_rand_bytes(12)
    {ciphertext, tag} = :crypto.crypto_one_time_aead(:aes_256_gcm, key(), iv, plaintext, @aad, true)
    <<@version, iv::binary, tag::binary, ciphertext::binary>>
  end

  def decrypt(<<@version, iv::binary-size(12), tag::binary-size(16), ciphertext::binary>>) do
    case :crypto.crypto_one_time_aead(:aes_256_gcm, key(), iv, ciphertext, @aad, tag, false) do
      :error -> {:error, :decryption_failed}
      plaintext -> {:ok, plaintext}
    end
  end

  def decrypt(_), do: {:error, :decryption_failed}

  def decrypt!(ciphertext) do
    {:ok, plaintext} = decrypt(ciphertext)
    plaintext
  end

  defp key do
    case Application.fetch_env!(:klix, :encryption_key) |> Base.decode64() do
      {:ok, <<key::binary-size(32)>>} -> key
      _ -> raise "ENCRYPTION_KEY must be 32 bytes, base64 encoded (openssl rand -base64 32)"
    end
  end
end

defmodule Klix.Phone do
  @moduledoc "Normalizes Kenyan phone numbers to the 2547XXXXXXXX form M-Pesa expects."

  @doc """
      iex> Klix.Phone.normalize("0712 345 678")
      "254712345678"
      iex> Klix.Phone.normalize("+254712345678")
      "254712345678"
      iex> Klix.Phone.normalize("712345678")
      "254712345678"
  """
  def normalize(nil), do: nil

  def normalize(phone) when is_binary(phone) do
    digits = String.replace(phone, ~r/\D/, "")

    cond do
      digits == "" -> nil
      String.starts_with?(digits, "254") -> digits
      String.starts_with?(digits, "0") -> "254" <> String.slice(digits, 1..-1//1)
      String.length(digits) == 9 -> "254" <> digits
      true -> digits
    end
  end

  def valid?(phone), do: is_binary(phone) and Regex.match?(~r/^254\d{9}$/, phone)
end

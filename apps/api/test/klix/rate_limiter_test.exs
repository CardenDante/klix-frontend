defmodule Klix.RateLimiterTest do
  use ExUnit.Case, async: false

  setup do
    Application.put_env(:klix, :rate_limiting_enabled, true)
    on_exit(fn -> Application.put_env(:klix, :rate_limiting_enabled, false) end)
  end

  test "allows up to the limit, then asks the client to wait" do
    key = {:test, make_ref()}
    assert :ok = Klix.RateLimiter.hit(key, 2, 60)
    assert :ok = Klix.RateLimiter.hit(key, 2, 60)
    assert {:error, retry_after} = Klix.RateLimiter.hit(key, 2, 60)
    assert retry_after in 1..60
  end
end

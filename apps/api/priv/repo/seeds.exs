# Development data: an admin, an approved organizer with a few published
# events, and a promoter code. Run with `mix run priv/repo/seeds.exs`.
#
# Accounts (password for all: "password123"):
#   admin@klix.test      admin
#   organizer@klix.test  organizer
#   staff@klix.test      event staff
#   fan@klix.test        attendee

alias Klix.{Accounts, Events, Repo}
alias Klix.Accounts.User
alias Klix.Promoters.PromoterCode

if Repo.get_by(User, email: "admin@klix.test") do
  IO.puts("Seed data already present, skipping.")
else
  user = fn email, role, first, last ->
    {:ok, user} =
      Accounts.register_user(%{
        "email" => email,
        "password" => "password123",
        "first_name" => first,
        "last_name" => last,
        "phone_number" => "0712345678"
      })

    user |> Ecto.Changeset.change(role: role, email_verified: true) |> Repo.update!()
  end

  admin = user.("admin@klix.test", "admin", "Ada", "Admin")
  organizer_user = user.("organizer@klix.test", "attendee", "Otieno", "Events")
  staff = user.("staff@klix.test", "event_staff", "Sam", "Scanner")
  _fan = user.("fan@klix.test", "attendee", "Faith", "Fan")

  {:ok, organizer} =
    Accounts.apply_as_organizer(organizer_user, %{
      "business_name" => "Nairobi Nights Live",
      "description" => "Concerts, festivals and good times across Nairobi.",
      "website" => "https://example.com"
    })

  {:ok, organizer} = Accounts.approve_organizer(organizer, admin)

  now = DateTime.utc_now()
  days = fn n, hour -> now |> DateTime.add(n * 86_400, :second) |> Map.merge(%{hour: hour, minute: 0, second: 0, microsecond: {0, 6}}) end

  events = [
    %{
      "title" => "Sauti Sol Reunion Concert",
      "category" => "music",
      "location" => "Uhuru Gardens, Nairobi",
      "description" => "<p>An unforgettable night of live music under the stars.</p>",
      "banner_image_url" => "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",
      "start_datetime" => days.(14, 17),
      "end_datetime" => days.(14, 23),
      "tickets" => [{"Regular", "2500", 2000}, {"VIP", "7500", 300}, {"VVIP", "15000", 50}]
    },
    %{
      "title" => "Nairobi Tech Summit 2026",
      "category" => "conference",
      "location" => "KICC, Nairobi",
      "description" => "<p>Two days of talks from builders across Africa.</p>",
      "banner_image_url" => "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200",
      "start_datetime" => days.(30, 6),
      "end_datetime" => days.(31, 15),
      "tickets" => [{"Early Bird", "3000", 200}, {"Standard", "5000", 800}]
    },
    %{
      "title" => "Laugh Industry Comedy Night",
      "category" => "comedy",
      "location" => "Carnivore Grounds, Nairobi",
      "description" => "<p>Kenya's funniest comedians, one stage.</p>",
      "banner_image_url" => "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200",
      "start_datetime" => days.(7, 16),
      "end_datetime" => days.(7, 20),
      "tickets" => [{"General", "1500", 500}]
    },
    %{
      "title" => "Community Clean-up & Picnic",
      "category" => "charity",
      "location" => "Karura Forest, Nairobi",
      "description" => "<p>Free entry. Bring gloves and good vibes.</p>",
      "banner_image_url" => "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200",
      "start_datetime" => days.(10, 6),
      "end_datetime" => days.(10, 11),
      "tickets" => [{"Free RSVP", "0", 300}]
    }
  ]

  for attrs <- events do
    {tickets, attrs} = Map.pop(attrs, "tickets")
    {:ok, event} = Events.create_event(organizer, attrs)

    tickets
    |> Enum.with_index()
    |> Enum.each(fn {{name, price, qty}, i} ->
      {:ok, _} =
        Events.create_ticket_type(event, %{
          "name" => name,
          "price" => price,
          "quantity_total" => qty,
          "sort_order" => i
        })
    end)

    {:ok, event} = Events.publish_event(event)

    {:ok, _} =
      Klix.Staff.assign(event, organizer_user, %{"email" => staff.email})

    if event.category == "music" do
      Repo.insert!(%PromoterCode{
        code: "KLIX10",
        code_type: "discount",
        discount_percentage: Decimal.new(10),
        commission_percentage: Decimal.new(5),
        promoter_id: admin.id,
        event_id: event.id
      })
    end
  end

  IO.puts("Seeded #{length(events)} events. Sign in as organizer@klix.test / password123.")
end

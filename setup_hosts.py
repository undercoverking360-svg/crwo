import socket

domains = [
    "script.google.com",
    "script.googleusercontent.com",
    "crwo.in",
    "www.google.com",
    "google.com",
    "play.googleapis.com",
    "connectivitycheck.gstatic.com",
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "res.cloudinary.com",
    "discord.gg"
]

hosts_entries = []
for d in domains:
    try:
        ip = socket.gethostbyname(d)
        hosts_entries.append(f"{ip} {d}")
        print(f"Resolved {d} -> {ip}")
    except Exception as e:
        print(f"Failed {d}: {e}")

with open("/tmp/crwo_hosts", "w") as f:
    f.write("\n".join(hosts_entries) + "\n")


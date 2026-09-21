#!/usr/bin/env bash
set -e

echo "Setting up Waydroid network..."
sudo waydroid shell -- ip link set dev eth0 up
sudo waydroid shell -- ip addr flush dev eth0
sudo waydroid shell -- ip addr add 192.168.240.2/24 dev eth0
sudo waydroid shell -- ip route add default via 192.168.240.1 dev eth0 || true
sudo waydroid shell -- ip route add default via 192.168.240.1 dev eth0 table eth0 || true
sudo waydroid shell -- ip rule add from all lookup main pref 100 || true
sudo waydroid shell -- ip rule add from all lookup eth0 pref 200 || true

# Set dns
sudo waydroid shell -- setprop net.dns1 8.8.8.8
sudo waydroid shell -- setprop net.eth0.dns1 8.8.8.8
sudo waydroid shell -- setprop net.eth0.dns2 1.1.1.1

# Enable NAT on host
sudo sysctl -w net.ipv4.ip_forward=1
WIFI_DEV=$(ip route show default | awk '{print $5}' | head -n 1)
echo "Routing via $WIFI_DEV"
sudo iptables -t nat -C POSTROUTING -s 192.168.240.0/24 -o "$WIFI_DEV" -j MASQUERADE 2>/dev/null || sudo iptables -t nat -A POSTROUTING -s 192.168.240.0/24 -o "$WIFI_DEV" -j MASQUERADE
sudo iptables -C FORWARD -i waydroid0 -o "$WIFI_DEV" -j ACCEPT 2>/dev/null || sudo iptables -A FORWARD -i waydroid0 -o "$WIFI_DEV" -j ACCEPT
sudo iptables -C FORWARD -i "$WIFI_DEV" -o waydroid0 -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || sudo iptables -A FORWARD -i "$WIFI_DEV" -o waydroid0 -m state --state RELATED,ESTABLISHED -j ACCEPT

# Test ping
echo "Testing Waydroid internet..."
sudo waydroid shell -- ping -c 2 8.8.8.8

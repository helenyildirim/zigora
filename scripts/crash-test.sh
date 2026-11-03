#!/usr/bin/env bash
# Installs the release APK, walks Home -> Levels -> Level 1, and records what happened.
set -u
OUT=crash-report
PKG=com.helenyildirim.zigora
mkdir -p "$OUT"

shot() { adb exec-out screencap -p > "$OUT/$1.png"; }
alive() { [ -n "$(adb shell pidof "$PKG" | tr -d '\r')" ] && echo "alive" || echo "DEAD"; }
tap() {
  adb shell uiautomator dump /sdcard/ui.xml > /dev/null 2>&1
  adb exec-out cat /sdcard/ui.xml > "$OUT/ui-$2.xml"
  python3 - "$OUT/ui-$2.xml" "$1" <<'P' > "$OUT/tap.txt"
import re, sys
xml = open(sys.argv[1], errors='ignore').read()
for node in re.findall(r'<node [^>]*>', xml):
    if f'text="{sys.argv[2]}"' in node or f'content-desc="{sys.argv[2]}' in node:
        a, b, c, d = map(int, re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', node).groups())
        print((a + c) // 2, (b + d) // 2)
        break
P
  read -r X Y < "$OUT/tap.txt" || true
  echo "tap '$1' at ${X:-?} ${Y:-?}" | tee -a "$OUT/steps.txt"
  [ -n "${X:-}" ] && adb shell input tap "$X" "$Y"
}

adb install -r android/app/build/outputs/apk/release/app-release.apk | tee "$OUT/install.txt"
adb logcat -c
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
sleep 25
echo "after launch: $(alive)" | tee -a "$OUT/steps.txt"
shot 1-home

tap "Oyna" oyna
sleep 12
echo "after Oyna: $(alive)" | tee -a "$OUT/steps.txt"
shot 2-levels

tap "Seviye 1" level
sleep 12
echo "after level 1: $(alive)" | tee -a "$OUT/steps.txt"
shot 3-level-1

adb logcat -d > "$OUT/logcat.txt"
adb logcat -d -b crash > "$OUT/logcat-crash.txt"
exit 0

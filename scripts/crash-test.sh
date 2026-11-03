#!/usr/bin/env bash
# Installs the release APK, walks Home -> Levels -> Level 1, and records what happened.
set -u
PKG=com.helenyildirim.zigora

shot() { adb exec-out screencap -p > "$OUT/$1.png"; }
alive() { [ -n "$(adb shell pidof "$PKG" | tr -d '\r')" ] && echo "alive" || echo "DEAD"; }
screen() {
  adb shell uiautomator dump /sdcard/ui.xml > /dev/null 2>&1
  adb exec-out cat /sdcard/ui.xml > "$OUT/screen-$1.xml"
  echo "--- screen $1"
  python3 - "$OUT/screen-$1.xml" <<'P'
import re, sys
xml = open(sys.argv[1], errors='ignore').read()
for node in re.findall(r'<node [^>]*>', xml):
    text = re.search(r' text="([^"]*)"', node).group(1)
    desc = re.search(r'content-desc="([^"]*)"', node).group(1)
    if text or desc:
        print(text or desc, re.search(r'bounds="([^"]*)"', node).group(1))
P
}
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

run() {
  NAME=$1
  OUT=crash-report/$NAME
  mkdir -p "$OUT"
  adb uninstall "$PKG" > /dev/null 2>&1
  adb install -r "apks/$NAME.apk" | tee "$OUT/install.txt"
  adb logcat -c
  adb shell am start -W -n "$PKG/.MainActivity"
  sleep 25
  echo "after launch: $(alive)" | tee -a "$OUT/steps.txt"
  shot 1-home
  screen home

  tap "Oyna" oyna
  sleep 12
  echo "after Oyna: $(alive)" | tee -a "$OUT/steps.txt"
  shot 2-levels
  screen levels

  tap "Seviye 1" level
  sleep 12
  echo "after level 1: $(alive)" | tee -a "$OUT/steps.txt"
  shot 3-level-1

  screen level
  tap "İpucu" hint
  sleep 4
  echo "after hint: $(alive)" | tee -a "$OUT/steps.txt"
  screen offer
  tap "Reklam İzle" ad
  sleep 30
  echo "after ad: $(alive)" | tee -a "$OUT/steps.txt"
  screen ad

  adb logcat -d > "$OUT/logcat.txt"
  adb logcat -d -b crash > "$OUT/logcat-crash.txt"
  echo "=== CRASH BUFFER $NAME"
  head -80 "$OUT/logcat-crash.txt"
  echo "=== JS AND RUNTIME $NAME"
  grep -E "ReactNativeJS|AndroidRuntime|libc  |DEBUG   |ActivityManager: (Start|Process|Force)|Expo" "$OUT/logcat.txt" | tail -120
  echo "=== END $NAME"
}

run fixed
exit 0

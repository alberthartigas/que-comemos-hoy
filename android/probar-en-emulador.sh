#!/bin/bash
# Corre dentro del emulador de GitHub Actions: instala la APK, la abre con Chrome disponible y
# luego con Chrome deshabilitado (como un celular sin Google), y guarda capturas y logcat en diagnostico/.
set -x
PKG=tech.laspinchisalitas.appcomidas
mkdir -p diagnostico
adb wait-for-device
adb shell settings put global window_animation_scale 0
adb install -r que-comemos-hoy.apk | tee diagnostico/0-instalacion.txt
adb shell dumpsys package "$PKG" | grep -E "versionName|targetSdk" | head -3 >> diagnostico/0-instalacion.txt

probar() {
  local etiqueta="$1"
  adb shell am force-stop "$PKG"
  adb logcat -c
  adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1
  sleep 15
  adb exec-out screencap -p > "diagnostico/$etiqueta-pantalla.png"
  adb shell dumpsys activity activities | grep -iE "ResumedActivity|topResumed" | head -6 > "diagnostico/$etiqueta-actividad.txt"
  adb logcat -d > "diagnostico/$etiqueta-logcat.txt"
  grep -aE "FATAL|AndroidRuntime|appcomidas|TwaLauncher|LauncherActivity|TrustedWebActivity|WebViewFallback" "diagnostico/$etiqueta-logcat.txt" | head -80 > "diagnostico/$etiqueta-resumen.txt" || true
}

probar 1-con-chrome
adb shell pm disable-user --user 0 com.android.chrome | tee diagnostico/2-chrome-deshabilitado.txt
probar 2-sin-chrome
adb shell pm enable com.android.chrome || true
ls -la diagnostico

#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

APKSIGNER="/home/ritesh/android-sdk/build-tools/35.0.0/apksigner"
KEYSTORE="$DIR/android/app/crwo-release.jks"
KEYPASS="crwo2026"
ALIAS="crwo"

mkdir -p apks
mkdir -p dist-admin
mkdir -p dist-user

echo "=== 0. Building Frontend Bundle ==="
npm run build

echo "=== Syncing Assets to dist-admin and dist-user ==="
cp -r dist/assets dist-admin/
cp -r dist/assets dist-user/

echo "=== 1. Building Signed CRWO Admin Release APK ==="
cat << 'CONFIG' > capacitor.config.json
{
  "appId": "org.crwo.admin",
  "appName": "CRWO Admin",
  "webDir": "dist-admin",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0,
      "launchAutoHide": true
    }
  }
}
CONFIG

sed -i 's/namespace = ".*"/namespace = "org.crwo.admin"/' android/app/build.gradle
sed -i 's/applicationId ".*"/applicationId "org.crwo.admin"/' android/app/build.gradle
sed -i 's/<string name="app_name">.*<\/string>/<string name="app_name">CRWO Admin<\/string>/' android/app/src/main/res/values/strings.xml
sed -i 's/<string name="title_activity_main">.*<\/string>/<string name="title_activity_main">CRWO Admin<\/string>/' android/app/src/main/res/values/strings.xml

npx cap sync android
sed -i 's/VERSION_21/VERSION_17/g' android/app/capacitor.build.gradle 2>/dev/null || true
sed -i 's/VERSION_21/VERSION_17/g' android/capacitor-cordova-android-plugins/build.gradle 2>/dev/null || true
sed -i 's/VERSION_21/VERSION_17/g' node_modules/@capacitor/local-notifications/android/build.gradle 2>/dev/null || true
sed -i 's/jvmToolchain(21)/jvmToolchain(17)/g' node_modules/@capacitor/local-notifications/android/build.gradle 2>/dev/null || true

cd android
./gradlew assembleRelease
cd ..

RELEASE_APK="android/app/build/outputs/apk/release/app-release-unsigned.apk"
if [ ! -f "$RELEASE_APK" ]; then
  RELEASE_APK="android/app/build/outputs/apk/release/app-release.apk"
fi

$APKSIGNER sign --ks "$KEYSTORE" --ks-pass "pass:$KEYPASS" --ks-key-alias "$ALIAS" --key-pass "pass:$KEYPASS" --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "$RELEASE_APK"
$APKSIGNER verify --verbose "$RELEASE_APK"

cp "$RELEASE_APK" apks/CRWO-Admin.apk
cp "$RELEASE_APK" /home/ritesh/Desktop/CRWO-Admin.apk
cp "$RELEASE_APK" /home/ritesh/Desktop/crwo-admin.apk
echo "CRWO Admin Release APK built & signed successfully!"

echo "=== 2. Building Signed CRWO User Release APK ==="
cat << 'CONFIG' > capacitor.config.json
{
  "appId": "org.crwo.user",
  "appName": "CRWO",
  "webDir": "dist-user",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0,
      "launchAutoHide": true
    }
  }
}
CONFIG

sed -i 's/namespace = ".*"/namespace = "org.crwo.user"/' android/app/build.gradle
sed -i 's/applicationId ".*"/applicationId "org.crwo.user"/' android/app/build.gradle
sed -i 's/<string name="app_name">.*<\/string>/<string name="app_name">CRWO<\/string>/' android/app/src/main/res/values/strings.xml
sed -i 's/<string name="title_activity_main">.*<\/string>/<string name="title_activity_main">CRWO<\/string>/' android/app/src/main/res/values/strings.xml

npx cap sync android
sed -i 's/VERSION_21/VERSION_17/g' android/app/capacitor.build.gradle 2>/dev/null || true
sed -i 's/VERSION_21/VERSION_17/g' android/capacitor-cordova-android-plugins/build.gradle 2>/dev/null || true
sed -i 's/VERSION_21/VERSION_17/g' node_modules/@capacitor/local-notifications/android/build.gradle 2>/dev/null || true
sed -i 's/jvmToolchain(21)/jvmToolchain(17)/g' node_modules/@capacitor/local-notifications/android/build.gradle 2>/dev/null || true

cd android
./gradlew assembleRelease
cd ..

RELEASE_APK="android/app/build/outputs/apk/release/app-release-unsigned.apk"
if [ ! -f "$RELEASE_APK" ]; then
  RELEASE_APK="android/app/build/outputs/apk/release/app-release.apk"
fi

$APKSIGNER sign --ks "$KEYSTORE" --ks-pass "pass:$KEYPASS" --ks-key-alias "$ALIAS" --key-pass "pass:$KEYPASS" --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "$RELEASE_APK"
$APKSIGNER verify --verbose "$RELEASE_APK"

cp "$RELEASE_APK" apks/CRWO-User.apk
cp "$RELEASE_APK" /home/ritesh/Desktop/CRWO-User.apk
cp "$RELEASE_APK" /home/ritesh/Desktop/crwo.apk
echo "CRWO User Release APK built & signed successfully!"

echo "=== All Signed Release APKs Built Successfully ==="
ls -lh apks/
ls -lh /home/ritesh/Desktop/*.apk

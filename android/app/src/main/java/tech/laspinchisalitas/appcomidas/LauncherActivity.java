package tech.laspinchisalitas.appcomidas;

import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;

/**
 * Igual que la LauncherActivity de la librería, pero le agrega a la URL de arranque el número de
 * versión de esta APK (?apk=N). Con eso la web sabe qué versión tiene instalada la persona y puede
 * avisarle cuando haya una release más nueva en GitHub (ver js/actualizaciones.js).
 */
public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    @Override
    protected Uri getLaunchingUrl() {
        Uri url = super.getLaunchingUrl();
        long version = versionCode();
        if (version <= 0 || url.getQueryParameter("apk") != null) return url;
        return url.buildUpon().appendQueryParameter("apk", String.valueOf(version)).build();
    }

    private long versionCode() {
        try {
            PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
            return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? info.getLongVersionCode() : info.versionCode;
        } catch (Exception e) {
            return 0;
        }
    }
}

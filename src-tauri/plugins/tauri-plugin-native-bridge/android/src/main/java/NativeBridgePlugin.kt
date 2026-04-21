package com.github.mrkovalskik.native_bridge

import android.content.Intent
import android.net.Uri
import android.util.Log
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke
import java.io.File
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

@InvokeArg
class CopyURIRequestArgs {
  var uri: String? = null
  var dst: String? = null
}

@TauriPlugin
class NativeBridgePlugin(private val activity: android.app.Activity) : Plugin(activity) {

  fun handleIntent(intent: Intent) {
    val uri = intent.data ?: return
    if (intent.action == Intent.ACTION_VIEW) {
      try {
        activity.contentResolver.takePersistableUriPermission(
          uri, Intent.FLAG_GRANT_READ_URI_PERMISSION
        )
      } catch (e: SecurityException) {
        Log.e("NativeBridge", "takePersistableUriPermission failed: ${e.message}")
      }
    }
  }

  @Command
  fun copy_uri_to_path(invoke: Invoke) {
    val args = invoke.parseArgs(CopyURIRequestArgs::class.java)
    val ret = JSObject()
    try {
      val uri = Uri.parse(args.uri ?: throw IllegalArgumentException("uri required"))
      val dst = File(args.dst ?: throw IllegalArgumentException("dst required"))
      dst.parentFile?.mkdirs()

      val input = activity.contentResolver.openInputStream(uri)
        ?: throw IllegalStateException("Cannot open stream for URI")

      dst.outputStream().use { out -> input.use { it.copyTo(out) } }
      ret.put("success", true)
    } catch (e: Exception) {
      Log.e("NativeBridge", "copy_uri_to_path: ${e.message}")
      ret.put("success", false)
      ret.put("error", e.message)
    }
    invoke.resolve(ret)
  }

  @Command
  fun get_safe_area_insets(invoke: Invoke) {
    val ret = JSObject()
    try {
      val wi = ViewCompat.getRootWindowInsets(activity.window.decorView)
      if (wi != null) {
        val bars = wi.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
        val d = activity.resources.displayMetrics.density
        ret.put("top", bars.top / d)
        ret.put("bottom", bars.bottom / d)
        ret.put("left", bars.left / d)
        ret.put("right", bars.right / d)
      } else {
        ret.put("top", 0.0)
        ret.put("bottom", 0.0)
        ret.put("left", 0.0)
        ret.put("right", 0.0)
      }
    } catch (e: Exception) {
      ret.put("top", 0.0)
      ret.put("bottom", 0.0)
      ret.put("left", 0.0)
      ret.put("right", 0.0)
    }
    invoke.resolve(ret)
  }
}

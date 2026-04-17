package com.github.mrkovalskik

import android.os.Bundle
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    registerPlugin(EpubPickerPlugin::class.java)
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }
}

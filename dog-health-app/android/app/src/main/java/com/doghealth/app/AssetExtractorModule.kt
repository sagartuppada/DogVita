package com.doghealth.app

import android.os.Environment
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream

class AssetExtractorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AssetExtractor"

    @ReactMethod
    fun extract(assetPath: String, destPath: String, promise: Promise) {
        try {
            val assetManager = reactApplicationContext.assets
            val inputStream = assetManager.open(assetPath)
            val destFile = File(destPath)
            destFile.parentFile?.mkdirs()
            val outputStream = FileOutputStream(destFile)
            val buffer = ByteArray(8192)
            var bytesRead: Int
            var totalRead = 0L
            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                outputStream.write(buffer, 0, bytesRead)
                totalRead += bytesRead
            }
            outputStream.flush()
            outputStream.close()
            inputStream.close()
            promise.resolve(destFile.absolutePath)
        } catch (e: Exception) {
            promise.reject("ASSET_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun exists(assetPath: String, promise: Promise) {
        try {
            val files = reactApplicationContext.assets.list(assetPath.substringBeforeLast("/"))
            val fileName = assetPath.substringAfterLast("/")
            promise.resolve(files != null && files.contains(fileName))
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}

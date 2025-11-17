import { useState, useEffect, useCallback } from 'react'

const maskApiKey = (key) => {
  if (!key) return ''
  if (key.length <= 4) {
    return '*'.repeat(key.length)
  }

  const visibleSuffix = key.slice(-4)
  const maskedLength = Math.max(key.length - 4, 0)
  return `${'*'.repeat(maskedLength)}${visibleSuffix}`
}

export function useApiKey() {
  const [apiKey, setApiKey] = useState('')
  const [originalApiKey, setOriginalApiKey] = useState(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState(null)

  const loadApiKey = useCallback(async () => {
    try {
      const key = await window.electronAPI.getApiKey()
      setOriginalApiKey(key)
      setApiKey(key ? maskApiKey(key) : '')
      setShowApiKey(false)
      setStatus('idle')
      setErrorMessage(null)
      return key
    } catch (err) {
      console.error('Error loading API key:', err)
      setApiKey('')
      setOriginalApiKey(null)
      setShowApiKey(false)
      setStatus('idle')
      return null
    }
  }, [])

  const saveApiKey = useCallback(async (keyToSave) => {
    if (!keyToSave || !keyToSave.trim()) {
      setStatus('error')
      setErrorMessage('API key cannot be empty')
      return { success: false, error: 'API key cannot be empty' }
    }

    setStatus('loading')
    setErrorMessage(null)

    try {
      const result = await window.electronAPI.setApiKey(keyToSave.trim())
      if (result.success) {
        setStatus('success')
        await loadApiKey()
        return { success: true }
      } else {
        const errorMsg = result.error || 'Failed to save API key'
        setStatus('error')
        setErrorMessage(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = err.message || 'An error occurred'
      setStatus('error')
      setErrorMessage(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [loadApiKey])

  const toggleVisibility = useCallback(() => {
    const maskedOriginal = originalApiKey ? maskApiKey(originalApiKey) : ''

    if (apiKey && apiKey.includes('*') && originalApiKey) {
      // If showing masked key, show real key
      setApiKey(originalApiKey)
      setShowApiKey(true)
    } else if (showApiKey && originalApiKey && apiKey === originalApiKey) {
      // If showing real key, show masked version
      setApiKey(maskedOriginal)
      setShowApiKey(false)
    } else {
      // Toggle visibility for new input
      setShowApiKey(!showApiKey)
    }
  }, [apiKey, originalApiKey, showApiKey])

  const reset = useCallback(() => {
    setApiKey('')
    setOriginalApiKey(null)
    setShowApiKey(false)
    setStatus('idle')
    setErrorMessage(null)
  }, [])

  useEffect(() => {
    loadApiKey()
  }, [loadApiKey])

  return {
    apiKey,
    setApiKey,
    originalApiKey,
    showApiKey,
    status,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    isIdle: status === 'idle',
    error: errorMessage,
    loadApiKey,
    saveApiKey,
    toggleVisibility,
    reset,
    maskApiKey
  }
}

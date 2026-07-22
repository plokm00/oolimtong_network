"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { calculateDistance, calculateBearing, generateRandomCoordinate } from "@/lib/gps-utils"
import { Loader2, Navigation, MapPin } from "lucide-react"
import KoreaMap from "@/components/KoreaMap"

export default function WorldPassageGame() {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [targetPos, setTargetPos] = useState<{ latitude: number; longitude: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [bearing, setBearing] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameStatus, setGameStatus] = useState<'SEARCHING' | 'FOUND'>('SEARCHING')

  const watchId = useRef<number | null>(null)

  // GPS Logic
  useEffect(() => {
    const isSecureRequest = window.isSecureContext || window.location.hostname === 'localhost';

    if (!isSecureRequest && window.location.protocol !== 'https:') {
      setError("HTTPS REQUIRED: GPS needs secure connection.")
      setLoading(false)
      return
    }

    if (!navigator.geolocation) {
      setError("GPS NOT SUPPORTED on this device.")
      setLoading(false)
      return
    }

    let positionReceived = false

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        positionReceived = true
        const { latitude, longitude } = position.coords
        setUserPos({ lat: latitude, lng: longitude })
        setLoading(false)
        setError(null)

        if (!targetPos) {
          const newTarget = generateRandomCoordinate(latitude, longitude, 50, 150)
          setTargetPos(newTarget)
        }
      },
      (err) => {
        console.error('GPS Error Details:', err.code, err.message, err)
        let msg = "GPS Signal Weak or Denied."
        if (err.code === 1) msg = "PERMISSION DENIED: Allow location access."
        if (err.code === 2) msg = "SIGNAL LOST: Position unavailable."
        if (err.code === 3) msg = "TIMEOUT: GPS timed out."
        setError(msg)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    )

    const fallbackTimeout = setTimeout(() => {
      if (!positionReceived && loading) {
        setLoading(false)
      }
    }, 10000)

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current)
      clearTimeout(fallbackTimeout)
    }
  }, [])

  // Calculate distance and bearing
  useEffect(() => {
    if (userPos && targetPos) {
      const dist = calculateDistance(userPos.lat, userPos.lng, targetPos.latitude, targetPos.longitude)
      const dir = calculateBearing(userPos.lat, userPos.lng, targetPos.latitude, targetPos.longitude)

      setDistance(dist)
      setBearing(dir)

      if (dist < 2 && gameStatus !== 'FOUND') {
        setGameStatus('FOUND')
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200])
        }
      }
    }
  }, [userPos, targetPos, gameStatus])

  const handleReset = () => {
    if (userPos) {
      const newTarget = generateRandomCoordinate(userPos.lat, userPos.lng, 50, 150)
      setTargetPos(newTarget)
      setGameStatus('SEARCHING')
    }
  }

  // Render KoreaMap with bearing prop
  return <KoreaMap bearing={bearing} />
}

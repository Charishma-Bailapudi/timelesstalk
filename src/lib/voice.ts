"use client";

let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let activeStop: (() => void) | null = null;

export function stopSpeaking(): void {
  const stop = activeStop;
  activeStop = null;

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.removeAttribute("src");
    activeAudio.load();
    activeAudio = null;
  }

  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }

  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  stop?.();
}

export function speakText(
  text: string,
  personaId: string,
  onEnd?: () => void,
  onStart?: () => void,
): Promise<void> {
  stopSpeaking();

  return new Promise((resolve) => {
    let cancelled = false;
    let settled = false;
    let usingSpeechSynthesis = false;
    let audioForThisRequest: HTMLAudioElement | null = null;
    let objectUrlForThisRequest: string | null = null;
    let stopThisPlayback: (() => void) | null = null;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      if (audioForThisRequest && activeAudio === audioForThisRequest) {
        audioForThisRequest.onended = null;
        audioForThisRequest.onerror = null;
        audioForThisRequest.onplaying = null;
        activeAudio = null;
      }
      if (
        objectUrlForThisRequest &&
        activeObjectUrl === objectUrlForThisRequest
      ) {
        URL.revokeObjectURL(objectUrlForThisRequest);
        activeObjectUrl = null;
      }
      if (activeStop === stopThisPlayback) {
        activeStop = null;
      }
      onEnd?.();
      resolve();
    };

    stopThisPlayback = () => {
      cancelled = true;
      finish();
    };
    activeStop = stopThisPlayback;

    const fallbackToBrowserSpeech = () => {
      if (
        cancelled ||
        usingSpeechSynthesis ||
        typeof window === "undefined" ||
        !window.speechSynthesis
      ) {
        finish();
        return;
      }

      usingSpeechSynthesis = true;
      if (audioForThisRequest) {
        audioForThisRequest.onended = null;
        audioForThisRequest.onerror = null;
        audioForThisRequest.onplaying = null;
        audioForThisRequest.pause();
        if (activeAudio === audioForThisRequest) {
          activeAudio = null;
        }
        audioForThisRequest = null;
      }
      if (objectUrlForThisRequest) {
        URL.revokeObjectURL(objectUrlForThisRequest);
        if (activeObjectUrl === objectUrlForThisRequest) {
          activeObjectUrl = null;
        }
        objectUrlForThisRequest = null;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => onStart?.();
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    };

    void fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, personaId }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("ElevenLabs voice request failed.");
        }

        const audioBlob = await response.blob();
        if (cancelled) {
          finish();
          return;
        }

        objectUrlForThisRequest = URL.createObjectURL(audioBlob);
        activeObjectUrl = objectUrlForThisRequest;
        const audio = new Audio(objectUrlForThisRequest);
        audioForThisRequest = audio;
        activeAudio = audio;
        audio.onplaying = () => onStart?.();
        audio.onended = finish;
        audio.onerror = fallbackToBrowserSpeech;
        await audio.play().catch(fallbackToBrowserSpeech);
      })
      .catch(fallbackToBrowserSpeech);
  });
}

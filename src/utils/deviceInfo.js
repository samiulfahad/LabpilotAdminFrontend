// src/utils/deviceInfo.js

function detectDeviceType() {
  const ua = navigator.userAgent;
  if (/Mobi|Android.*Mobile|iPhone/.test(ua)) return "mobile";
  if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) return "tablet";
  return "desktop";
}

function detectBrowser() {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return { browser: "Edge", browserVersion: ua.match(/Edg\/([\d.]+)/)?.[1] ?? "" };
  if (/OPR\//.test(ua)) return { browser: "Opera", browserVersion: ua.match(/OPR\/([\d.]+)/)?.[1] ?? "" };
  if (/Chrome\//.test(ua)) return { browser: "Chrome", browserVersion: ua.match(/Chrome\/([\d.]+)/)?.[1] ?? "" };
  if (/Firefox\//.test(ua)) return { browser: "Firefox", browserVersion: ua.match(/Firefox\/([\d.]+)/)?.[1] ?? "" };
  if (/Safari\//.test(ua)) return { browser: "Safari", browserVersion: ua.match(/Version\/([\d.]+)/)?.[1] ?? "" };
  return { browser: "Unknown", browserVersion: "" };
}

function detectOS() {
  const ua = navigator.userAgent;
  if (/Windows NT 10/.test(ua)) return { os: "Windows", osVersion: "10/11" };
  if (/Windows NT 6\.3/.test(ua)) return { os: "Windows", osVersion: "8.1" };
  if (/Windows NT 6\.1/.test(ua)) return { os: "Windows", osVersion: "7" };
  if (/Windows/.test(ua)) return { os: "Windows", osVersion: "" };
  if (/Android ([\d.]+)/.test(ua)) {
    return { os: "Android", osVersion: ua.match(/Android ([\d.]+)/)?.[1] ?? "" };
  }
  if (/iPhone OS ([\d_]+)/.test(ua)) {
    return { os: "iOS", osVersion: (ua.match(/iPhone OS ([\d_]+)/)?.[1] ?? "").replace(/_/g, ".") };
  }
  if (/iPad.*OS ([\d_]+)/.test(ua)) {
    return { os: "iPadOS", osVersion: (ua.match(/OS ([\d_]+)/)?.[1] ?? "").replace(/_/g, ".") };
  }
  if (/Mac OS X ([\d_]+)/.test(ua)) {
    return { os: "macOS", osVersion: (ua.match(/Mac OS X ([\d_]+)/)?.[1] ?? "").replace(/_/g, ".") };
  }
  if (/Linux/.test(ua)) return { os: "Linux", osVersion: "" };
  return { os: "Unknown", osVersion: "" };
}

/**
 * Returns device metadata to send to the server on login.
 * @returns {{ deviceType, browser, browserVersion, os, osVersion, screenRes, timezone, language }}
 */
export function getDeviceInfo() {
  const { browser, browserVersion } = detectBrowser();
  const { os, osVersion } = detectOS();

  return {
    deviceType: detectDeviceType(),
    browser,
    browserVersion,
    os,
    osVersion,
    screenRes: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language ?? "",
  };
}

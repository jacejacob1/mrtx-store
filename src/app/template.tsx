/**
 * Route transition. A template remounts on every navigation, so its
 * CSS animation replays each time.
 *
 * Deliberately CSS, not Motion, and deliberately never from opacity 0:
 * a JS fade from 0 hides the server-rendered HTML until hydration, which
 * delays first paint and leaves the page blank with JavaScript off.
 * This starts visible and only settles into place.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}

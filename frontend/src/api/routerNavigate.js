/**
 * routerNavigate.js
 * Provides a singleton navigate function so the Axios client can redirect
 * to /login on 401 without importing React Router directly (which would
 * cause a circular dependency and force a hard page reload).
 *
 * Usage — call setNavigate() once inside App.jsx after the router mounts:
 *
 *   import { setNavigate } from '@/api/routerNavigate';
 *   import { useNavigate } from 'react-router-dom';
 *
 *   function NavigateSetter() {
 *     const navigate = useNavigate();
 *     useEffect(() => { setNavigate(navigate); }, [navigate]);
 *     return null;
 *   }
 */

let _navigate = null;

/** Called once from App.jsx to register the React Router navigate fn. */
export function setNavigate(fn) {
  _navigate = fn;
}

/** Retrieved by client.js on 401 — may be null before the router mounts. */
export function getNavigate() {
  return _navigate;
}

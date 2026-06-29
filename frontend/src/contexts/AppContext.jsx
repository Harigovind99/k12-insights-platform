import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { ROLES, DEFAULT_FILTERS } from '@/utils/constants';

// ─── State shape ────────────────────────────────────────────────────────────
const initialState = {
  role: ROLES.DISTRICT_ADMIN,
  sidebarCollapsed: false,
  filters: { ...DEFAULT_FILTERS },
  selectedStudentId: null,
  schemaModalOpen: false,
  notification: null, // { message, type: 'success'|'error'|'info' }
};

// ─── Action types ────────────────────────────────────────────────────────────
export const APP_ACTIONS = {
  SET_ROLE:              'SET_ROLE',
  TOGGLE_SIDEBAR:        'TOGGLE_SIDEBAR',
  SET_FILTER:            'SET_FILTER',
  RESET_FILTERS:         'RESET_FILTERS',
  SET_SELECTED_STUDENT:  'SET_SELECTED_STUDENT',
  OPEN_SCHEMA_MODAL:     'OPEN_SCHEMA_MODAL',
  CLOSE_SCHEMA_MODAL:    'CLOSE_SCHEMA_MODAL',
  SHOW_NOTIFICATION:     'SHOW_NOTIFICATION',
  CLEAR_NOTIFICATION:    'CLEAR_NOTIFICATION',
};

// ─── Reducer ─────────────────────────────────────────────────────────────────
function appReducer(state, { type, payload }) {
  switch (type) {
    case APP_ACTIONS.SET_ROLE:
      return { ...state, role: payload, filters: { ...DEFAULT_FILTERS } };

    case APP_ACTIONS.TOGGLE_SIDEBAR:
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case APP_ACTIONS.SET_FILTER:
      return { ...state, filters: { ...state.filters, ...payload } };

    case APP_ACTIONS.RESET_FILTERS:
      return { ...state, filters: { ...DEFAULT_FILTERS } };

    case APP_ACTIONS.SET_SELECTED_STUDENT:
      return { ...state, selectedStudentId: payload };

    case APP_ACTIONS.OPEN_SCHEMA_MODAL:
      return { ...state, schemaModalOpen: true };

    case APP_ACTIONS.CLOSE_SCHEMA_MODAL:
      return { ...state, schemaModalOpen: false };

    case APP_ACTIONS.SHOW_NOTIFICATION:
      return { ...state, notification: payload };

    case APP_ACTIONS.CLEAR_NOTIFICATION:
      return { ...state, notification: null };

    default:
      return state;
  }
}

// ─── Context & Provider ───────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setRole              = useCallback((role)    => dispatch({ type: APP_ACTIONS.SET_ROLE, payload: role }), []);
  const toggleSidebar        = useCallback(()        => dispatch({ type: APP_ACTIONS.TOGGLE_SIDEBAR }), []);
  const setFilter            = useCallback((patch)   => dispatch({ type: APP_ACTIONS.SET_FILTER, payload: patch }), []);
  const resetFilters         = useCallback(()        => dispatch({ type: APP_ACTIONS.RESET_FILTERS }), []);
  const setSelectedStudent   = useCallback((id)      => dispatch({ type: APP_ACTIONS.SET_SELECTED_STUDENT, payload: id }), []);
  const openSchemaModal      = useCallback(()        => dispatch({ type: APP_ACTIONS.OPEN_SCHEMA_MODAL }), []);
  const closeSchemaModal     = useCallback(()        => dispatch({ type: APP_ACTIONS.CLOSE_SCHEMA_MODAL }), []);
  const showNotification     = useCallback((msg, type = 'info') =>
    dispatch({ type: APP_ACTIONS.SHOW_NOTIFICATION, payload: { message: msg, type } }), []);
  const clearNotification    = useCallback(()        => dispatch({ type: APP_ACTIONS.CLEAR_NOTIFICATION }), []);

  const value = {
    ...state,
    setRole,
    toggleSidebar,
    setFilter,
    resetFilters,
    setSelectedStudent,
    openSchemaModal,
    closeSchemaModal,
    showNotification,
    clearNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within <AppProvider>');
  return ctx;
}

export default AppContext;

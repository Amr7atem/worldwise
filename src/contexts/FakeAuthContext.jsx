import { createContext, useContext, useEffect, useReducer } from "react";
import supabase from "../../utils/supabase";

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "login":
      return { ...state, user: action.payload, isAuthenticated: true };

    case "logout":
      return { ...state, user: null, isAuthenticated: false };

    default:
      throw new Error("Unknown Action");
  }
}

function AuthProvider({ children }) {
  const [{ user, isAuthenticated }, dispatch] = useReducer(
    reducer,
    initialState
  );

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        dispatch({ type: "login", payload: session.user });
      }
    }

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") {
          dispatch({ type: "login", payload: session.user });
        }
        if (event === "SIGNED_OUT") {
          dispatch({ type: "logout" });
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { success: false, error: error.message };
    } else {
      dispatch({ type: "login", payload: data.user });
      return { success: true };
    }
  }

  // async function signup(email, password) {
  //   const { data, error } = await supabase.auth.signUp({ email, password });
  //   if (error) {
  //     return { success: false, error: error.message };
  //   } else {
  //     dispatch({ type: "login", payload: data.user });
  //     return { success: true };
  //   }
  // }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      dispatch({ type: "logout" });
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("AuthContext was used outside AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth };

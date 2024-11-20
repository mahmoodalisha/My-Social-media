import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Login.css"; 

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(4, "Too Short!").required("Required"),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const dispatch = useDispatch();
  const [errorMessage, setErrorMessage] = useState(""); // State for error messages

  return (
    <div className="container login-container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card"> {/* Added card class */}
            <h2 className="text-center">Login</h2>
            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={LoginSchema}
              onSubmit={async (values) => {
                setErrorMessage(""); // Reset error message on new submission
                try {
                  const response = await axios.post(
                    "http://localhost:5000/api/users/login",
                    values
                  );
                  if (response.status === 200) {
                    const userData = response.data;
                    login(userData); // Context API
                    dispatch(setUser(userData)); // Redux
                    navigate("/home");
                  }
                } catch (error) {
                  console.error("Login failed:", error);
                  setErrorMessage("Login failed. Please check your credentials.");
                }
              }}
            >
              {({ errors, touched }) => (
                <Form>
                  <div>
                    <label className="form-label">Email</label>
                    <Field
                      name="email"
                      type="email"
                      className="form-control"
                    />
                    {errors.email && touched.email && (
                      <div className="text-danger">{errors.email}</div>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Password</label>
                    <Field
                      name="password"
                      type="password"
                      className="form-control"
                    />
                    {errors.password && touched.password && (
                      <div className="text-danger">{errors.password}</div>
                    )}
                  </div>
                  {errorMessage && (
                    <div className="text-danger">{errorMessage}</div>
                  )}
                  <button type="submit" className="btn-primary">
                    Login
                  </button>
                </Form>
              )}
            </Formik>
          </div> {/* End of card */}
          
          {/* Link to Register Page */}
          <p className="text-center mt-3">
            New user? <a href="/register">Register here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(4, "Too Short!").required("Required"),
});

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <h2>Login</h2>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={async (values) => {
          try {
            const response = await axios.post("http://localhost:5000/api/users/login", values);
            if (response.status === 200) {
              // Store the token in local storage
              localStorage.setItem("token", response.data.token);
              console.log("JWT Token:", response.data.token); // Log the token to the console
              navigate("/home");
            }
          } catch (error) {
            console.error("Login failed:", error);
          }
        }}
      >
        {({ errors, touched }) => (
          <Form>
            <div>
              <label>Email</label>
              <Field name="email" type="email" />
              {errors.email && touched.email && <div>{errors.email}</div>}
            </div>
            <div>
              <label>Password</label>
              <Field name="password" type="password" />
              {errors.password && touched.password && <div>{errors.password}</div>}
            </div>
            <button type="submit">Login</button>
          </Form>
        )}
      </Formik>
      <p>
        New user? <a href="/register">Register here</a>
      </p>
    </div>
  );
};

export default Login;

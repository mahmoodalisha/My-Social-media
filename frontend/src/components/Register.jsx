// src/components/Register.jsx
import React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import '../styles/Register.css'

const RegisterSchema = Yup.object().shape({
  username: Yup.string().required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(4, "Too Short!").required("Required"),
});

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="register-container">
      <h2>Register</h2>
      <Formik
        initialValues={{ username: "", email: "", password: "" }}
        validationSchema={RegisterSchema}
        onSubmit={async (values) => {
          try {
            const response = await axios.post("http://localhost:5000/api/users/register", values);
            if (response.status === 200) {
              navigate("/login");
            }
          } catch (error) {
            console.error("Registration failed:", error);
          }
        }}
      >
        {({ errors, touched }) => (
          <Form>
            <div>
              <label>Username</label>
              <Field name="username" type="text" />
              {errors.username && touched.username && <div>{errors.username}</div>}
            </div>
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
            <button type="submit">Register</button>
          </Form>
        )}
      </Formik>
      <p>
        Already an existing user? <a href="/login">Login here</a>
      </p>
    </div>
  );
};

export default Register;

import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import cookie from "cookie";
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(
  process.env.KEY
);

import auth from "../middleware/auth";

const prisma = new PrismaClient();

const register = async (req: Request, res: Response) => {
  const { name, email, mobileNum, password, address, district, state } =
    req.body;

  try {
    let errors: any = {};

    //validate data
    const user = await prisma.user.findFirst({
      where: { email: email },
    });
    if (user) errors.userdata = "This user already exists!";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json(errors);
    }

    //create user
    const userData = await prisma.user.create({
      data: {
        name: name,
        email: email,
        mobileNum: mobileNum,
        password: password,
        address: address,
        district: district,
        state: state,
      },
    });
    const msg = {
      to: `${req.body.email}`, // Change to your recipient
      from: "great-minds@gravitybrain.org", // Change to your verified sender
      subject: "Please verify your mail",
      html: `<p>Dear ${req.body.name},</p>
            <a href='http://localhost:3000/userLogin'>Click here to verify your account</a>
            `,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((err: any) => {
        console.error(err);
      });

    return res.json(userData);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        password: password,
      },
    });

    if (!user)
      return res
        .status(404)
        .json({ loginError: "Worng username and password combination !!" });

    //gen JWT
    const token = jwt.sign({ email }, process.env.JWT_SECRET!);
    //store JWT in cookie
    res.set(
      "Set-Cookie",
      cookie.serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600,
        path: "/", //cookie valid for whole site
      })
    );

    return res.json(user);
  } catch (error) {
    console.log(error);
    return res.json({ erroe: "Oops, that should not have happened :/ " });
  }
};

const logout = async (req: Request, res: Response) => {
  res.set(
    "Set-Cookie",
    cookie.serialize("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    })
  );

  return res.status(200).json({ logout: "true" });
};

const me = (req: Request, res: Response) => {
  return res.json(res.locals.user);
};

const postMe = async (req: Request, res: Response) => {
  const { uid } = req.body;

  try {
    const providerDetails = await prisma.user.findFirst({
      where: {
        id: uid,
      },
    });

    return res.json(providerDetails);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

const updateEmail = async (req: Request, res: Response) => {
  const userID = res.locals.user.id;

  const { email } = req.body;

  try {
    const emailData = await prisma.user.update({
      where: {
        id: userID,
      },
      data: {
        email: email,
      },
    });

    return res.json(emailData);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

const updateAddress = async (req: Request, res: Response) => {
  const userID = res.locals.user.id;

  const { district, state, address } = req.body;

  try {
    const emailData = await prisma.user.update({
      where: {
        id: userID,
      },
      data: {
        district: district,
        state: state,
        address: address,
      },
    });

    return res.json(emailData);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, me);
router.get("/logout", auth, logout);
router.post("/postMe", postMe);
router.post("/updateEmail", auth, updateEmail);
router.post("/updateAddress", auth, updateAddress);

export default router;

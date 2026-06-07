import jwt from "jsonwebtoken";

// const token = jwt.sign(
//   { id: user._id, name: user.name ,role: user.role},
//   process.env.JWT_SECRET,
//   { expiresIn: "1d" }
// );

const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn:process.env.JWT_EXPIRES_IN }
    );


res.json({ token });
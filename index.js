import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
dotenv.config();

const app = express();
// const PORT = 4000;
const PORT = process.env.PORT;

app.use(express.json());
const corsOptions = {
	origin: "*",
	credentials: true, //access-control-allow-credentials:true
	optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
// app.use(cors);
const MONGO_URL = process.env.MONGO_URL;
// const MONGO_URL = "mongodb+srv://Onkar:F5Z6B0KarUxuqzhJ@cluster0.roxwh.mongodb.net";
async function createConnection() {
	const client = await new MongoClient(MONGO_URL);
	client.connect();
	console.log("Mongo is Connected😁 😊");
	return client;
}
const client = await createConnection();

app.get("/mobiles", async function (req, res) {
	const employees = await client
		.db("b32we")
		.collection("mobiles")
		.find({})
		.toArray();
	res.send(employees);
});

app.put("/mobiles/:id", async function (req, res) {
	const { id } = req.params;
	const bigd = req.body;
	const nanu = await client
		.db("b32we")
		.collection("mobiles")
		.updateOne({ id: id }, { $set: bigd });
	res.send(nanu);
});

app.get("/:id", async function (req, res) {
	const { id } = req.params;
	console.log(req.params, id);

	const employee = await client
		.db("b32we")
		.collection("mobiles")
		.findOne({ _id: ObjectId(id) });
	employee ? res.send(employee) : res.send({ Msg: "Mobile not found" });
});

app.post("/mobiles", express.json(), async function (req, res) {
	const data = req.body;
	console.log(data);

	const result = await client
		.db("b32we")
		.collection("mobiles")
		.insertMany(data);
	res.send(result);
});

app.delete("/mobiles/:id", express.json(), async function (req, res) {
	const { id } = req.params;
	console.log(req.params, id);

	const userSession = await client
		.db("b32we")
		.collection("homies")
		.findOne({ token: token});

		if(userSession && userSession.isAdmin){
			const resulting = await client
			.db("b32we")
			.collection("mobiles")
			.deleteOne({ _id: ObjectId(id) });
		resulting.deletedCount > 0
			? res.send({ msg: "Mobile deleted sucessfully" })
			: res.send({ msg: "Mobile not found" });
		}else{
			res.status(401).send({ message: "Access Denied" });
		}
	});
		
	// const movie =movies.find((mv) => mv.id == id);
	//  res.send(movie);


async function generateHashedPAssword(password) {
	const NO_OF_ROUNDS = 10;
	const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
	const hashedPassword = await bcrypt.hash(password, salt);
	console.log(salt, hashedPassword);
	return hashedPassword;
}

app.post("/homies/signup", async function (req, res) {
	const { username, password, isAdmin } = req.body;
	const output1 = await client
		.db("b32we")
		.collection("homies")
		.findOne({ username: username });
	if (output1) {
		res.send({ message: "Username already exits" });
	} else if (password.length < 8) {
		res
			.status(400)
			.send({ message: "Password must be greater than 8 characters" });
	} else {
		const hashedPassword = await generateHashedPAssword(password);
		const output = await client.db("b32we").collection("homies").insertOne({
			username: username,
			password: hashedPassword,
			isAdmin: isAdmin,
		});
		res.send(output);
	}
});
app.post("/homies/login", async function (req, res) {
	const { username, password } = req.body;
	const output1 = await client
		.db("b32we")
		.collection("homies")
		.findOne({ username: username });
	console.log(output1);
	if (!output1) {
		res.status(401).send({ message: "Invalid credentials" });
	} else {
		const storedPassword = output1.password;
		const isPasswordMatched = await bcrypt.compare(password, storedPassword);
		console.log(isPasswordMatched);
		if (isPasswordMatched) {
			const token = jwt.sign({ id: output1._id }, process.env.SECRET_KEY);
			const result = await client.db("b32we").collection("session").insertOne({
				userId: output1._id,
				username: output1.username,
				isAdmin: output1.isAdmin,
				token: token,
			});

			res.send({ msg: "Successful Login", token: token , isAdmin: output1.isAdmin});
		} else {
			res.status(401).send({ message: "Invalid Credentials" });
		}
	}
});

app.listen(PORT, () => console.log(`App Started in ${PORT}`));

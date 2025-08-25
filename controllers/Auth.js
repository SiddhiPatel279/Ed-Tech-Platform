const bcrypt = require("bcrypt");
const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();


// Get the email from the request.

// Check if a user already exists with that email.

    // If yes, send back: "User already registered".

// If not, generate a 6-digit OTP.

// Check if the OTP is already used.

    // If yes, generate a new one until it's unique.

// Save the OTP with the email in the database.

// Respond with: "OTP Sent Successful" and the OTP.

// If something goes wrong, send an error response.
// **********************send otp************************
exports.sendOTP=async(req,res)=>{

    try{
        // fetch email from request body
        const {email}=req.body

		// Check if user is already present
		// Find user with provided email
        const checkUserPresent=await User.findOne({email})
		// to be used in case of signup

        // if user already exist then return a response
        // If user found with provided email
        if(checkUserPresent){
            // Return 401 Unauthorized status code with error message
            return res.status(401).json({
                success:false,
                message:'User already registered',
            })
        }

        // generate OTP
        var otp=otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
        })

        // check unique otp or not
        const result = await OTP.findOne({ otp: otp });
		console.log("Result is Generate OTP Func");
		console.log("OTP", otp);
		console.log("Result", result);

        // jab tak mujhe ye collections/database mein se otp mil ra hai 
        // tab tak mein naya OTP generate karta rahoga
        while (result) {
			otp = otpGenerator.generate(6, {
				upperCaseAlphabets: false,
			});
		}

        const otpPayload={email,otp}

        // create an entry for OTP
        const otpBody =await OTP.create(otpPayload)
        console.log("OTP Body", otpBody);
		res.status(200).json({
			success: true,
			message: `OTP Sent Successfully`,
			otp,
		});
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

// *****************signUp****************
exports.signUp=async(req,res)=>{
    try{
        // data fetch from request ki body
        const{
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body 
        // validate krlo
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(403).json({
                success:false,
                message:"All fields are required",
            })
        }
        // 2 password match karlo
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:'Password and Confirm Password Value does not match, please try again'
            })
        }
        // check user already exists or not
        const existingUser=await User.findOne({email})
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:'User already exists. Please sign in to continue.'
            })
        }
        
        // find most recent OTP stored for the user 
        const response = await OTP.find({email}).sort({createdAt:-1}).limit(1)
        console.log(response)
        // Validate OTP
        if(response.length==0){
            //  OTP not found
            return res.status(400).json({
                success:false,
                message:'The OTP is not valid'
            })
        }else if(otp!== response[0].otp){
            // Invalid OTP
            return res.status(400).json({
                success:false,
                message:"The OTP is not valid"
            })
        }

        // Hash Password
        const hashedPassword=await bcrypt.hash(password,10)

		// Create the user
		let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);

        // entry created in DB

        const profileDetails=await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        })

        const user = await User.create({
			firstName,
			lastName,
			email,
			contactNumber,
			password: hashedPassword,
			accountType: accountType,
			approved: approved,
			additionalDetails: profileDetails._id,
			image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
		});
        // return response
        return res.status(200).json({
            success:true,
            message:'User is registered Successfully',   
            user
        })
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:'User cannot be registered. Please try again'
        })
    }
}
// **********************Login**********************
exports.login=async(req,res)=>{
    try{
        // get data from req body
        // Get email and password from request body
        const {email,password}=req.body
        // validation data - Check if email or password is missing
        if(!email || !password){
            // Return 400 Bad Request status code with error message
            return res.status(403).json({
                success:false,
                message:"Please Fill up All the Required Fields"
            })
        }
        // user check exist or not
        const user=await User.findOne({email}).populate("additionalDetails")
        // If user not found with provided email
        if(!user){
            return res.status(401).json({
                success:false,
                message:"User is not Registered with Us Please SignUp to Continue"
            })
        }
        // generate JWT ,after password matching
        if(await bcrypt.compare(password,user.password)){
            const token = jwt.sign(
				{ email: user.email, id: user._id, accountType: user.accountType },
				process.env.JWT_SECRET,
				{
					expiresIn: "24h",
				}
			);
            user.token=token
            user.password=undefined
        
            // create cookie and send response
            const options={
                expires:new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true
            }
            res.cookie("token",token,options).status(200).json({
                success:true,
                token,
                user,
                message:"User Login Success"
            })
        }
        else{
            return res.status(401).json({
                success:false,
                message:"Password is incorrect"
            })
        }
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:'Login Failure ,please try again'
        })
    }
}

// *****************change password**************
// exports.changePassword=async(req,res)=>{
//     // get data from req body
//     // get oldPassword, newPassword, confirmPassword
//     // validation

//     // update password in DB
//     // send mail-Password Updated
//     // return response
// }
// *****************change password**************
exports.changePassword = async (req, res) => {
	try {
		// Get user data from req.user
		const userDetails = await User.findById(req.user.id);

		// Get old password, new password, and confirm new password from req.body
		const { oldPassword, newPassword, confirmNewPassword } = req.body;

		// Validate old password
		const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if (!isPasswordMatch) {
			// If old password does not match, return a 401 (Unauthorized) error
			return res
				.status(401)
				.json({ success: false, message: "The password is incorrect" });
		}

		// Match new password and confirm new password
		if (newPassword !== confirmNewPassword) {
			// If new password and confirm new password do not match, return a 400 (Bad Request) error
			return res.status(400).json({
				success: false,
				message: "The password and confirm password does not match",
			});
		}

		// Update password
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);

		// Send notification email
		try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
				)
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}

		// Return success response
		return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });
	} catch (error) {
		// If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
	}
};


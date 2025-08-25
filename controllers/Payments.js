const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");



exports.capturePayment=async (req,res)=>{
    // get courseId and UserID
    const {course_id}=req.body
    const userId=req.user.id;
// validation

    // valid courseId   
        if(!course_id){
        return res.json({
            success:false,
            message:"Please provide valid course ID"
        })
    }
    
    // valid courseDetail   ----since db call will be made use try catch
    let course;
    try{
        course=await Course.findById(course_id)
        if(!course){
            return res.json({
                success:false,
                message:"Could not find the course"
            })
        }

    // user already pay for the same course
        // we now have courseDetails ,course has StudentsEnrolled so we can use this to verify 
        // inside my course model userId is stored in form/type of object
        // Right now my userId is of String type so I need to convert it into object type
    const uid = new mongoose.Types.ObjectId(userId); //converted String to ObjectId
    if(course.studentsEnrolled.includes(uid)){
        return res.status(200).json({
            success:false,
            message:"Student is already enrolled"
        })
    }
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }

    // order create
    const amount=course.price
    const currency="INR"

    const options={
        amount:amount*100,
        currency,
        receipt:Math.random(Date.now()).toString(),
        notes:{
            courseId:course_id,
            userId
        }
    }
        // creating and order
    try{
        // initialize the payment using Razorpay
        const paymentResponse = await instance.orders.create(options)
        console.log(paymentResponse)
        // return response
        return res.status(200).json({
            success:true,
            courseName:course.courseName,
            courseDescription:course.courseDescription,
            thumbnail:course.thumbnail,
            orderId:paymentResponse.id,
            currency:paymentResponse.currency,
            amount:paymentResponse.amount
        })
    }
    catch(error){
        console.log(error)
        res.json({
            success:false,
            message:"Could not initiate order"
        })
    }
    // return response
}

// verify Signature of Razorpay and Server

exports.verifySignature = async (req,res)=>{
    const webhookSecret="12345678"  //on the server
    // the other coming from razorpay
    const signature = req.headers["x-razorpay-signature"]

    const shasum = crypto.createHmac("sha256",webhookSecret)
    shasum.update(JSON.stringify(req.body))
    const digest=shasum.digest("hex");

    // Now we need to match the signature and digest
    if(signature === digest){
        console.log("Payment is Authorised")
        const {courseId,userId} = req.body.payload.payment.entity.notes;

        try{
            // fulfill the action

            // find the course and enroll the student in it
            const enrolledCourse = await Course.findOneAndUpdate(
                                                {_id:courseId},
                                                {$push:{studentsEnrolled:userId}},
                                                {new:true}
            )

            if(!enrolledCourse){
                return res.status(500).json({
                    success:false,
                    message:'Course not Found'
                })
            }

            console.log(enrolledCourse)

            // find the student and add the course to their list of enrolled courses
            const enrolledStudent = await User.findOneAndUpdate(
                                                {_id:userId},
                                                {$push:{courses:courseId}},
                                                {new:true}
            )
            console.log(enrolledStudent)

            // mail send kardo confirmation wala - saying u are successfully registered for the course
            const emailResponse = await mailSender(
                                            enrolledStudent.email,
                                            "Congratulations from CodeHelp",
                                            "Congratulations, you are onboarded into new Codehelp Course"
            )

            console.log(emailResponse)
            return res.status(200).json({
                success:true,
                message:"Signature Verified and Course Added"
            })
        }
        catch(error){
            console.log(error)
            return res.status(500).json({
                success:false,
                message:error.message
            })
        }
    }

    else{
        return response.status(400).json({
            success:false,
            message:'Invalid request',
        })
    }
}
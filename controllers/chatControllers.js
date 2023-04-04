const asyncHandler=require("express-async-handler");
const Chat=require("../models/chatModel");
const User=require("../models/userModel")


const accessChat=asyncHandler(async(req,res)=>{
	const {userId}=req.body;

	if(!userId)
	{
		return res.sendStatus(400);
	}

	//if chat is found then populate the users array
	var isChat= await Chat.find({
		isGroupChat:false,
		$and:[ 
			{users:{$elemMatch:{$eq:req.user._id}}},
			{users:{$elemMatch:{$eq:userId}}}
		],
	}).populate("users","-password").populate("latestMessage");

	//populating latest message in message schema with users foung
	isChat=await User.populate(isChat,{
		path:"latestMessage.sender",
		select:"name email picture"
	});
	if(isChat.length>0){
		res.send(isChat[0]);
	}
	else{
		var chatData={
			chatName:"sender",
			isGroupChat:false,
			users:[req.user._id,userId]
		};
		try{
			const createdChat=await Chat.create(chatData);
			const FullChat=await Chat.findOne({_id:createdChat._id}).populate(
				"users","-password"
			);
			res.status(200).send(FullChat)  
		}
		catch(error){
			res.status(400);
			throw new Error(error.message)
		}

	}

})


const fetchChats=asyncHandler(async(req,res)=>{
	try{
		Chat.find({users:{$elemMatch:{$eq:req.user._id}}})
		.populate("users","-password")
		.populate("groupAdmin","-password")
		.populate("latestMessage")
		.sort({updatedAt:-1})
		.then(async (res)=>{
			results=await User.populate(res,{
				path:"latestMessage.sender",
				select:"name picture email"
			}) 
		})
	}
	catch(err){
		res.status(400);
		throw new Error(err.message)
	}
})

 

module.exports={accessChat,fetchChats}
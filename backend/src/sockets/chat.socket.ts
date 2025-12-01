import { Server, Socket } from 'socket.io';
import { Chat } from '../models/chat.model';

const setupChatSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    // On connect
    console.log(`User connected: ${socket.id}`);

    let currentRoom: string | null = null

    //join 
    socket.on('joinRoom',async(data)=>{
      currentRoom = data.room
      socket.join(data.room)

      const message = await Chat.find({room: data.room})
      socket.emit('loadMessages',message)

      socket.emit("newMessage",{username: "System", message:`Welcome to ${data.room},
        ${data.username}`})

      socket.broadcast.to(data.room).emit("newMessage",{
        username: "System",
        message: `${data.username} has joined ${data.room}`
      })
    })

    //leave
    socket.on("leaveRoom",async(data)=>{
      socket.leave(data.room)
      if(data.username){
        socket.to(data.room).emit("newMessage",{
          username: "System", message: `${data.username} has left ${data.room}`
        })
      }
    })

    // Listen to 'sendMessage' event
    socket.on('sendMessage', async (data) => {
      const { username, message } = data;

      try {
        // Save message to MongoDB
        const chat = new Chat({ username, message });
        await chat.save();

        // Broadcast the chat object to all connected clients via the newMessage event
        io.emit('newMessage', chat);
        
        // For room-based broadcast
        // io.to(data.room).emit('newMessage', chat)
      } catch (error) {
        console.error('Error saving chat:', error);
      }
    });

    // On disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

export default setupChatSocket;
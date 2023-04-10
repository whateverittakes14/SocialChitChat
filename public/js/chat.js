const socket = io()

const btn = document.querySelector("#message-form")
const inp = btn.querySelector('input');
const formbutton = btn.querySelector('button');
const Sendloc = document.querySelector('#send-location');
const mssgs = document.querySelector('#messages')
const loc = document.querySelector('#location')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//options
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll = () => {
    const $messages = mssgs
    const $newMessage = $messages.lastElementChild

    // Height of last message
    const messageStyle = getComputedStyle($newMessage)
    const messageMargin = parseInt(messageStyle.marginBottom)
    const messageHeight = $newMessage.offsetHeight + messageMargin
    // Visible Height
    const visibleHeight = $messages.offsetHeight
    // Height of message container
    const containerHeight = $messages.scrollHeight
    // How far have I scrolled
    const scrollOffSet = $messages.scrollTop + visibleHeight
    if( containerHeight - messageHeight <= scrollOffSet) {
        $messages.scrollTop = $messages.scrollHeight
    }
}
socket.on('message',(message)=>{
    const html = Mustache.render(messageTemplate,{
        message :message.text,
        createdAt :moment(message.createdAt).format('h:mm a'),
        username :message.username
    })
    mssgs.insertAdjacentHTML('beforeend',html)
    autoScroll();
 })
 socket.on('locationmessage',(url)=>{
    const html = Mustache.render(locationTemplate,{
        location :url.text ,
        createdAt:moment(url.createdAt).format('h:mm a'),
        username :url.username
    })
    mssgs.insertAdjacentHTML('beforeend',html)
    autoScroll()
 })
btn.addEventListener('submit',(e)=>{
    e.preventDefault()
    formbutton.setAttribute('disabled','disabled');
    const message = e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{
        formbutton.removeAttribute('disabled');
        inp.value = "";
        inp.focus();
        if(error){
            return console.log(error)
        }
        console.log('Message delivered!')
    });})
document.querySelector('#send-location').addEventListener('click',()=>{
    Sendloc.setAttribute('disabled','disabled');
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }

    navigator.geolocation.getCurrentPosition((position)=>{
        Sendloc.removeAttribute('disabled');
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        socket.emit('sendLocation',{latitude,longitude},()=>{
            console.log("Location shared");
        });
    })
})
socket.emit('join',{username,room},(e)=>{
    if(e){
        alert(e);
    }
    else console.log("User joined");
})
socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    console.log(users);
    document.querySelector('#sidebar').innerHTML = html
})
const url = new URL(window.location.href); // or use your URL string instead
const pathSegments = url.pathname.split('/').filter(Boolean);

// Check if 'kurir' is present and if there's something after it
const index = pathSegments.indexOf('kurir');
const hasParamAfterKurir = index !== -1 && index < pathSegments.length - 1;

console.log(hasParamAfterKurir); // true or false

const socket = io(socket_server); // Connects to your server


socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
});

function reloadTheTable() {
    if (document.getElementById('tb-paket')) {
        // If tb-paket is a DataTable instance
        $('#tb-paket').DataTable().destroy();
        reloadTable();
    }
}
console.log(global_data._id);
socket.on('kurir_ditugaskan_' + global_data._id, (data) => {
    const sound = new Audio('/sound/notif.mp3');
    sound.play().catch(() => {});
    toastr.info("Ada Pengiriman Baru Ditugaskan Untuk Anda");
    // check if tb-paket is available , if available destroy then  reloadTable()
    reloadTheTable();

    // console.log(data);
});

document.getElementById('h5-title').innerHTML = global_data.nama;

$("#img-avatar").attr("src", hasParamAfterKurir? 'kurir/' + global_data.gambar_kurir : 'kurir/kurir/' + global_data.gambar_kurir);
$("#img-avatar").css("width", "65px");
$("#img-avatar").css("height", "65px");


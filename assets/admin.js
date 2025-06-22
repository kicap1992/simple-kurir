const socket = io(socket_server); // Connects to your server

function reloadTheTable() {
    if (document.getElementById('tb-paket')) {
        // If tb-paket is a DataTable instance
        $('#tb-paket').DataTable().destroy();
        reloadTable();
    }
}


socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
});



// notifikasi pengiriman baru oleh user
socket.on('pengiriman_baru_client', (data) => {
    const sound = new Audio('/sound/notif.mp3');
    sound.play().catch(() => {});
    toastr.info("Ada Pengiriman Baru");
    // check if tb-paket is available , if available destroy then  reloadTable()
    reloadTheTable();

    // console.log(data);
});

// notifikasi pembatalan paket dilakukan oleh kurir
socket.on('pembatalan_paket_kurir', (data) => {
    const sound = new Audio('/sound/notif.mp3');
    sound.play().catch(() => {});
    toastr.warning("Kurir Membatalkan Pengambilan Paket No Resi <b>" + data._id + "</b>\nAlasan: <b>" + data.alasan + "</b>\nAdmin dapat menugaskan Kurir Baru atau Membatalkan Pengiriman.");
    // check if tb-paket is available , if available destroy then  reloadTable()
    reloadTheTable();
});

// notifikasi kurir dalam perjalanan mengambil paket
socket.on('kurir_mengambil_pengiriman_admin', (data) => {
    const sound = new Audio('/sound/notif.mp3');
    sound.play().catch(() => {});
    toastr.info("Kurir Menyetujui Pengambilan Paket No Resi <b>" + data._id + "</b> dan Dalam Perjalanan Mengambil Paket di Alamat Pengirim : <b>" + data.alamat_pengirim + "</b>");
    // check if tb-paket is available , if available destroy then  reloadTable()
    reloadTheTable();
});


// notifikasi kurir mengambil paket dari pengirim dan mengantarkan ke penerima
socket.on('kurir_menghantar_ke_penerima_admin', (data) => {
    const sound = new Audio('/sound/notif.mp3');
    sound.play().catch(() => {});
    // console.log(data);
    if(data.status == 'Mengirim Paket Ke Alamat Penerima') {
        toastr.info("Kurir Telah Mengambil Paket No Resi <b>" + data._id + "</b> dari Pengirim dan Dalam Perjalanan Mengantarkan ke Penerima di Alamat Penerima : <b>" + data.alamat_penerima + "</b>");
    }else {
        toastr.success("Kurir Telah Mengantarkan Paket No Resi <b>" + data._id + "</b> ke Penerima di Alamat Penerima : <b>" + data.alamat_penerima + "</b>");
    }
    
    // check if tb-paket is available , if available destroy then  reloadTable()
    reloadTheTable();
});

// notifikasi verifikasi paket diterima oleh user
socket.on('diterima_terverifikasi_admin', (data) => {
    console.log(data);
    const sound = new Audio('/sound/notif.mp3');
    sound.play().catch(() => {});
    toastr.success("Paket No Resi <b>" + data._id + "</b> Telah Diterima dan diverifikasi oleh Pengirim");
    // check if tb-paket is available , if available destroy then  reloadTable()
    reloadTheTable();
});


// tiada notifikasi sebab pengirim yang membatalkan pengiriman
socket.on('delete_kiriman_admin', (data) => {
    console.log(data);

    reloadTheTable();
});

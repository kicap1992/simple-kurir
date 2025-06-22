const socket = io(socket_server); // Connects to your server


socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
});

function reloadTheTable() {
    // check if tb-paket is available , if available destroy then  reloadTable()
    if (document.getElementById('tb-paket')) {
        // If tb-paket is a DataTable instance
        $('#tb-paket').DataTable().destroy();
        reloadTable();
    }
}


// notifikasi pembatalan paket oleh kurir
socket.on('pembatalan_paket_' + global_data._id, (data) => {
    const sound = new Audio('/sound/notif.mp3');
    sound.play().catch(() => { });
    toastr.warning(`Pembatalan Pengiriman Paket<br>Status: <b>${data.status}</b>`);
    console.log(data);
    // check if tb-paket is available , if available destroy then  reloadTable()
    reloadTheTable();

    // console.log(data);
});


// notifikasi kurir ditugaskan oleh admin
socket.on('kurir_ditugaskan_' + global_data._id, (data) => {
    const sound = new Audio('/sound/notif.mp3');
    sound.play().catch(() => { });
    toastr.info(`Kurir Telah Ditugaskan Untuk Pengiriman Paket<br>No Resi: <b>${data._id}</b>\nSila Liat Detail Pengiriman Untuk Informasi Lebih Lanjut`);
    console.log(data);
    // check if tb-paket is available , if available destroy then  reloadTable()
    reloadTheTable();

    // console.log(data);
});


// notifikasi pembatalan paket yang dilakukan oleh kurir
socket.on('pembatalan_paket_kurir_' + global_data._id, (data) => {
    const sound = new Audio('/sound/notif.mp3');
    sound.play().catch(() => { });
    toastr.warning("Kurir Membatalkan Pengambilan Paket No Resi <b>" + data._id + "</b>\nAdmin akan menugaskan Kurir Baru.\nMohon Maaf dan Harap Tunggu.");
    // check if tb-paket is available , if available destroy then  reloadTable()
    reloadTheTable();
});


// notifikasi kurir dalam perjalanan mengambil paket
socket.on('kurir_mengambil_pengiriman_' + global_data._id, (data) => {
    const sound = new Audio('/sound/notif.mp3');
    sound.play().catch(() => { });
    toastr.info("Kurir Dalam Perjalanan Mengambil Paket No Resi <b>" + data._id + "</b>\nDiharap Pengirim Menunggu Kurir Sampai");
    // check if tb-paket is available , if available destroy then  reloadTable()
    reloadTheTable();
});

// notifikasi kurir mengambil paket dari pengirim dan mengantarkan ke penerima
socket.on('kurir_menghantar_ke_penerima_' + global_data._id, (data) => {
    const sound = new Audio('/sound/notif.mp3');
    sound.play().catch(() => { });
    // console.log(data)
    if (data.status == 'Mengirim Paket Ke Alamat Penerima') {
        toastr.info("Kurir Telah Mengambil Paket No Resi <b>" + data._id + "</b> dari Pengirim dan Dalam Perjalanan Mengantarkan ke Penerima di Alamat Penerima : <b>" + data.alamat_penerima + "</b>");
    }else {
        toastr.success("Kurir Telah Mengantarkan Paket No Resi <b>" + data._id + "</b> ke Penerima di Alamat Penerima : <b>" + data.alamat_penerima + "</b>");
    }
    // check if tb-paket is available , if available destroy then  reloadTable()
    reloadTheTable();
});


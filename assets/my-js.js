let socket_server;

if (window.location.hostname === "20.20.20.26" && window.location.port === "3011") {
    socket_server = "http://20.20.20.26:3014";
} else {
    socket_server = "https://socket-shenior.mywork-kkk.online";
}

console.log("Socket server:", socket_server);
function logout() {
    return swal({
        title: "Yakin?",
        text: "Anda akan keluar dari sistem",
        type: "warning",
        showCancelButton: !0,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Ya, logout!",
        cancelButtonText: "Tidak, batal!",
        closeOnConfirm: !1,
        closeOnCancel: !1,
        confirmButtonColor: "#f60e0e"
    }, function (t) {
        if (t) {
            // remove local storage
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            window.location.href = "/"
        } else {
            // close swal
            swal.close()
        }
    })
}


function blockUI(message) {
    $.blockUI({
        message: message,
        css: {
            border: 'none',
            padding: '15px',
            backgroundColor: '#000',
            '-webkit-border-radius': '10px',
            '-moz-border-radius': '10px',
            opacity: .5,
            color: '#fff'
        }
    });
}

function notAvailable() {
    return swal({
        title: "Belum Tersedia",
        text: "Maaf, fitur ini belum tersedia",
        type: "info",
        timer: 2000,
        showConfirmButton: !1
    })
}

function thousandSeparator(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function enableInput(stat) {
    var inputs = document.querySelectorAll('#form-modal input');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].disabled = stat;
    }


    // disable all select in #form-modal
    var selects = document.querySelectorAll('#form-modal select');
    for (var i = 0; i < selects.length; i++) {
        selects[i].disabled = stat;
    }

    // disable all textarea in #form-modal
    var textareas = document.querySelectorAll('#form-modal textarea');
    for (var i = 0; i < textareas.length; i++) {
        textareas[i].disabled = stat;
    }

}



function numberOnly(element) { //only number and remove comma
    element.value = element.value.replace(/[^0-9]/g, '');
    element.value = element.value.replace(/,/g, '');
}

function formatToMakassar(dateString) {
  const dateObj = new Date(dateString);

  const options = {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const parts = new Intl.DateTimeFormat('id-ID', options).formatToParts(dateObj);

  const getPart = (type) => parts.find(p => p.type === type)?.value ?? '';

  // Format: DD-MM-YYYY, HH.mm.ss
  return `${getPart('day')}-${getPart('month')}-${getPart('year')}, ${getPart('hour')}.${getPart('minute')}.${getPart('second')}`;
}

const $dialog = document.getElementById('dialog');
const hideDialog = () => $dialog.classList.remove('visible');
const showDialog = (content, callback) => {
    $dialog.querySelector(':scope > .content > .body').innerText = content;
    $dialog.querySelector(':scope > .content > .ok').onclick = () => {
        hideDialog();
        if (typeof callback === 'function') {
            callback();
        }
    };
    $dialog.classList.add('visible');
};

const $addressDialog = document.getElementById('addressDialog');
const hideAddressDialog = () => $addressDialog.classList.remove('visible');
const showAddressDialog = (callback) => {
    const $content = $addressDialog.querySelector(':scope > .content');
    $content.innerHTML = '';
    new daum.Postcode({
        width: '100%',
        height: '100%',
        oncomplete: (data) => {
            console.log(data);
            if (typeof callback === 'function') {
                callback(data);
            }
        }
    }).embed($content);
    $addressDialog.classList.add('visible');
};

const $payDialog = document.getElementById('payDialog');
const hidePayDialog = () => $payDialog.classList.remove('visible');
const showPayDialog = (args) => {
    $payDialog.querySelector(':scope > .content > .spec > .item > .value.depart').innerText = args['depart'];
    $payDialog.querySelector(':scope > .content > .spec > .item > .value.destination').innerText = args['destination'];
    $payDialog.querySelector(':scope > .content > .spec > .item > .value.car-type').innerText = args['carType'];
    $payDialog.querySelector(':scope > .content > .spec > .item > .value.charge').innerText = args['charge'].toLocaleString() + '원';
    $payDialog.querySelector(':scope > .content > .button-container > .button.cancel').onclick = () => hidePayDialog();
    $payDialog.querySelector(':scope > .content > .button-container > .button.confirm').onclick = () => {
        const date = new Date();
        const imp = window.IMP;
        imp.init('imp73305074');
        imp.request_pay({
            pg: 'kakaopay.TC0ONETIME',
            pay_method: 'card',
            merchant_uid: `IMP-${date.getTime()}`,
            name: '타자(TAZA) 택시 호출',
            amount: args['charge'],
            buyer_email: 'iki39230316@gmail.com',
            buyer_name: '현재석'
        }, (resp) => {
            if (resp.success === true) {
                const history = {
                    timestamp: date.getTime(),
                    depart: args['depart'],
                    destination: args['destination'],
                    charge: args['charge']
                };
                const histories = JSON.parse(localStorage.getItem('histories')) ?? [];
                histories.push(history);
                localStorage.setItem('histories', JSON.stringify(histories));
                showDialog('결제가 완료되었습니다. 택시가 곧 출발지에 도착합니다.', () => hidePayDialog());
            } else {
                showDialog(`결제에 실패하였습니다. (${resp['error_msg']})`);
            }
        });
    };
    $payDialog.classList.add('visible');
};

const $historyDialog = document.getElementById('historyDialog');
const hideHistoryDialog = () => $historyDialog.classList.remove('visible');
const showHistoryDialog = () => {
    $historyDialog.classList.add('visible');

    const $list = $historyDialog.querySelector(':scope > .content > .list'); // ul 태그
    // 1. 위 $list가 가지는 모든 자식인 '.item'을 선택해 제거(remove)한다. 단, '.message'를 제거하지 않도록 주의한다.
    // $list.innerHTML = ''; // 이거 하지 않도록 주의(.message도 같이 날아감)
    $list.querySelectorAll('.item').forEach(($item) => $item.remove());

    // 2. localStorage에서 키가 'histories'인 내용을 불러와 JSON.parse를 거쳐 배열로 변환한다. 단, 그러한 항목이 없다면 빈 배열([])로 대체한다.
    const histories = JSON.parse(localStorage.getItem('histories')) ?? []; // a ?? b 꼴에서 ?? 연산자는 a가 null 혹은 undefined라면 b로 대체한다.

    // 3. 위 <2>에서 변환된 배열의 길이가 0이라면 $list가 가지는 '.message.empty'에 'visible'클래스를 추가한 후 로직 종료.
    const $empty = $list.querySelector(':scope > .message.empty');
    if (histories.length === 0) {
        $empty.classList.add('visible');
        return;
    }

    // 4. 위 <2>에서 변환된 배열의 길이가 0보다 크다면 $list가 가지는 '.message.empty'에 'visible'클래스를 제거한 후 5번으로.
    $empty.classList.remove('visible');

    // 5. 위 <2>에서 변환된 배열을 반복하여 반복되는 대상에 대해 li태그로 변환, 위 $list의 자식이 되도록 이어 붙인다.(append 혹은 innerHTML에 대해 +=)

    // for (const history of histories) {
    //     const date = new Date(history['timestamp']);
    //     // const year = date.getFullYear();
    //     // const month = (date.getMonth() + 1).toString().padStart(2, '0');
    //     // const day = date.getDate().toString().padStart(2, '0');
    //     // const hour = date.getHours().toString().padStart(2, '0');
    //     // const minute = date.getMinutes().toString().padStart(2, '0');
    //     // const second = date.getSeconds().toString().padStart(2, '0');
    //     // const timestamp = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    //     const timestamp = date.toISOString().split('T').map((s) => s.split('.')[0]).join(' ');
    //     //                    ↑'2025-03-14T06:36:40.903Z'
    //     //                                  ↑['2025-03-14', '06:36:40.903Z']
    //     //                                             ↑['2025-03-14', '06:36:40']
    //     //                                                                         ↑'2025-03-14 06:36:40'
    //     const html = `
    //         <li class="item">
    //             <span class="timestamp">${timestamp}</span>
    //             <span class="detail">
    //                 <span class="depart">${history['depart']}</span>
    //                 <span class="arrow">&#x2192;</span>
    //                 <span class="destination">${history['destination']}</span>
    //                 <span class="stretch" role="none"></span>
    //                 <span class="charge">${history['charge'].toLocaleString()}원</span>
    //             </span>
    //         </li>`;
    //     $list.innerHTML += html;
    // }

    $list.innerHTML += histories.map((history) => `
        <li class="item">
            <span class="timestamp">${new Date(history['timestamp']).toISOString().split('T').map((s) => s.split('.')[0]).join(' ')}</span>
            <span class="detail">
                <span class="depart">${history['depart']}</span>
                <span class="arrow">&#x2192;</span>
                <span class="destination">${history['destination']}</span>
                <span class="stretch" role="none"></span>
                <span class="charge">${history['charge'].toLocaleString()}원</span>
            </span>
        </li>`).reduce((acc, x) => acc + x, '');
};
$historyDialog.querySelector(':scope > .content > .button-container > .close').onclick = () => hideHistoryDialog();

const $nav = document.getElementById('nav');
$nav.querySelector(':scope > .history').onclick = () => showHistoryDialog();

const $console = document.getElementById('console');
const $locationForm = $console.querySelector(':scope > .location-form');
const departInfoWindow = new kakao.maps.InfoWindow({
    content: '<div style="width: 150px; padding: 0.5rem 0; text-align: center;">출발지</div>'
});
const destinationInfoWindow = new kakao.maps.InfoWindow({
    content: '<div style="width: 150px; padding: 0.5rem 0; text-align: center;">도착지</div>'
});
let departMarker;
let destinationMarker;
let departCoordinates;
let destinationCoordinates;
$locationForm['findDepart'].addEventListener('click', () => {
    showAddressDialog((data) => {
        $locationForm['addressDepart'].value = data['roadAddress'];
        hideAddressDialog();
        convertAddressToCoordinates(data['roadAddress'], (coordinates) => {
            departCoordinates = coordinates;
            departMarker?.setMap(null);
            departMarker = new kakao.maps.Marker({
                map: mapInstance,
                position: coordinates
            });
            departInfoWindow.open(mapInstance, departMarker);
            if (departCoordinates == null || destinationCoordinates == null) {
                mapInstance.setCenter(coordinates);
                mapInstance.setLevel(3);
            } else {
                findPath();
            }
        });
    });
});
$locationForm['findDestination'].addEventListener('click', () => {
    showAddressDialog((data) => {
        $locationForm['addressDestination'].value = data['roadAddress'];
        hideAddressDialog();
        convertAddressToCoordinates(data['roadAddress'], (coordinates) => {
            destinationCoordinates = coordinates;
            destinationMarker?.setMap(null);
            destinationMarker = new kakao.maps.Marker({
                map: mapInstance,
                position: coordinates
            });
            destinationInfoWindow.open(mapInstance, destinationMarker);
            if (departCoordinates == null || destinationCoordinates == null) {
                mapInstance.setCenter(coordinates);
                mapInstance.setLevel(3);
            } else {
                findPath();
            }
        });
    });
});

let polyline;
const findPath = () => {
    const bounds = new kakao.maps.LatLngBounds();
    bounds.extend(departCoordinates);
    bounds.extend(destinationCoordinates);
    mapInstance.setBounds(bounds);

    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if(xhr.readyState !== XMLHttpRequest.DONE) {
            return;
        }
        if(xhr.status < 200 || xhr.status >= 400) {
            alert('!!!');
            return;
        }
        const response = JSON.parse(xhr.responseText);
        const roads = response['routes'][0]['sections'][0]['roads'];
        const paths = [];
        for (const road of roads){
            road['vertexes'].forEach((v, i, a) => {
                if (i % 2 === 0) {
                    paths.push(new kakao.maps.LatLng(a[i + 1], a[i]));
                }
            });
        }
        polyline?.setMap(null);
        polyline = new kakao.maps.Polyline({
            path: paths,
            strokeWeight: 6,
            strokeColor: '#3498db',
            strokeOpacity: 0.8,
            strokeStyle: 'solid'
        });
        polyline.setMap(mapInstance);

        const guides = response['routes'][0]['sections'][0]['guides'];
        const $duration = $console.querySelector(':scope > .estimate > .text-container > .text > .value.duration');
        const $charge = $console.querySelector(':scope > .estimate > .text-container > .text > .value.charge');
        const $route = $console.querySelector(':scope > .route');
        let distance = 0;
        let duration = 0;
        $route.querySelectorAll(':scope > .item').forEach(($item) => $item.remove());
        $route.querySelector(':scope > .message.empty').classList.remove('visible');

        for (const guide of guides){
            distance += guide['distance'];
            duration += guide['duration'];
            if (guide['name'].length > 0){
                const $name = document.createElement('span');
                $name.classList.add('name');
                $name.innerText = guide['name'];
                const $guidance = document.createElement('span');
                $guidance.classList.add('guidance');
                $guidance.innerText = guide['guidance'];
                const $item = document.createElement('li');
                $item.classList.add('item');
                $item.append($name, $guidance);
                $item.addEventListener('click', ()=>{
                    const pos = new kakao.maps.LatLng(guide['y'], guide['x']);
                    mapInstance.setCenter(pos);
                    mapInstance.setLevel(3);
                });
                $route.append($item);
            }
        }
        const charge = 4500 + Math.trunc(distance / 131) * 100 + Math.trunc(duration / 30) * 100;
        const $estimate = $console.querySelector(':scope > .estimate');
        const $pay = $console.querySelector(':scope > .pay');
        $duration.innerText = Math.trunc(duration / 60) + '분';
        $charge.innerText = charge.toLocaleString() + '원';
        $estimate.classList.add('visible');
        $pay.innerText = `${charge.toLocaleString()}원 결제하기`;
        $pay.classList.add('visible');
        $pay.onclick = () => {
            showPayDialog({
                depart: $locationForm['addressDepart'].value,
                destination: $locationForm['addressDestination'].value,
                carType: $estimate.querySelector(':scope > .car')['type'].value,
                charge: charge
            });
        };
        const $car = $console.querySelector(':scope > .estimate > .car');
        $car['type'].value = 'basic';
    };
    const url = new URL('https://apis-navi.kakaomobility.com/v1/directions');
    url.searchParams.set('origin', `${departCoordinates.getLng()},${departCoordinates.getLat()}`);
    url.searchParams.set('destination', `${destinationCoordinates.getLng()},${destinationCoordinates.getLat()}`);
    xhr.open('GET', url.toString());
    xhr.setRequestHeader('Authorization', 'KakaoAK b3a90e7852ca523ecc72d40136c369ca');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
};

const $map = document.getElementById('map');
const mapInstance = new kakao.maps.Map($map, {
    center: new kakao.maps.LatLng(35.8655753, 128.59339),
    level: 3
});

const convertAddressToCoordinates = (address, callback) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
            const coordinates = new kakao.maps.LatLng(result[0].y, result[0].x);
            if (typeof callback === 'function') {
                callback(coordinates);
            }
        }
    });
};

































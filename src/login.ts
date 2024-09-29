import { ipcMain } from "electron";
import axios from "axios";

let accessToken: string | null = null;
let refreshToken: string | null = null;

// 토큰 불러오기
export function getAccessToken() {
    return accessToken;
}

export function getRefreshToken() {
    return refreshToken;
}

// 로그인 성공 시 메인 페이지로 이동하는 함수
function handleLogin(event: Electron.IpcMainEvent, username: string, password: string) {
    const url = 'http://localhost:3000/login';
    axios.post(url, { username, password })
        .then(response => {
            // 토큰 저장
            accessToken = response.data.accessToken;
            refreshToken = response.data.refreshToken;
            console.log('로그인 성공:', accessToken);
            event.sender.send('login-success');
        })
        .catch(error => {
            console.error('로그인 실패:', error.message);
            event.sender.send('login-fail');
        });
}

// 액세스 토큰 재발급 함수
function refreshAccessToken() {
    return axios.post('http://localhost:3000/token', { refreshToken })
        .then(response => {
            accessToken = response.data.accessToken; // 새로운 액세스 토큰 저장
            console.log('새로운 액세스 토큰:', accessToken);
        })
        .catch(error => {
            console.error('토큰 재발급 실패:', error.message);
        });
}

// API 요청을 보낼 때, 만료된 토큰이면 재발급 후 다시 요청
function apiRequestWithAuth(url: string, method: 'get' | 'post', data?: any) {
    return axios({
        method,
        url,
        data,
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }).catch(async error => {
        if (error.response && error.response.status === 401) {
            // 액세스 토큰이 만료된 경우
            console.log('토큰 만료, 재발급 시도');
            await refreshAccessToken(); // 새 토큰으로 교체
            return axios({
                method,
                url,
                data,
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
        }
        throw error; // 다른 에러는 그대로 전달
    });
}

// 프로필 정보 가져오는 함수
function getProfile(event: Electron.IpcMainEvent) {
    const url = 'http://localhost:3000/profile'; // 인증이 필요한 프로필 엔드포인트

    apiRequestWithAuth(url, 'get')
        .then(response => {
            console.log('프로필 정보:', response.data);
            event.sender.send('profile-success', response.data); // 프로필 데이터를 전송
        })
        .catch(error => {
            console.error('프로필 불러오기 실패:', error.message);
            event.sender.send('profile-fail');
        });
}

ipcMain.on('login', (event, data) => {
    const { username, password } = data;
    handleLogin(event, username, password);
});

// 프로필 요청을 받을 때 처리
ipcMain.on('get-profile', (event) => {
    getProfile(event);
});

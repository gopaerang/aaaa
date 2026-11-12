# My Vocab - 나만의 영어 단어장 📖

Firebase(Authentication & Cloud Firestore)와 Vite + React로 제작된 개인 맞춤형 영어 단어장 웹 애플리케이션입니다.

## ✨ 주요 기능
- **Google 계정 로그인 / 로그아웃**: 원클릭 간편 인증
- **단어 CRUD 관리**: 영어 단어, 한국어 뜻, 예문, 외움 상태 등록/수정/삭제
- **사용자별 데이터 격리**: Firestore `users/{userId}/words` 경로에 저장되어 각자 본인의 데이터만 안전하게 관리
- **외움 상태 원클릭 토글**: 카드에서 바로 외움/학습 중 상태 전환
- **원어민 발음 듣기 (TTS)**: Web Speech API를 통한 영어 단어 발음 재생
- **실시간 검색 및 필터링**: 단어/뜻 검색, 학습 중/외움 완료 필터 및 최신순/알파벳순 정렬
- **학습 통계 대시보드**: 전체 단어 수, 외운 단어 수, 암기 달성률(%) 프로그레스 바 제공

## 🛠️ 기술 스택
- **Frontend**: React 19, Vite, Lucide React (Icons)
- **Backend / BaaS**: Firebase Authentication, Cloud Firestore
- **Security**: Firestore Security Rules (`users/{userId}` 사용자 격리)

## 🚀 시작하기

### 1. 환경변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 Firebase 프로젝트의 설정값을 입력합니다:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 프로덕션 빌드
```bash
npm run build
```

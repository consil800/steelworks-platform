# 시스템 파일 구조 안내

이 시스템은 3개의 주요 카테고리로 구성되어 있습니다:

## 1. 홈페이지 외형과 관련파일 (1-homepage/)
각 회사가 간단히 수정할 수 있는 홈페이지 관련 파일들

### 📁 templates/
- `index.html` - 메인 홈페이지
- `starter-page.html` - 시작 페이지
- `scout-index.html`, `scout-starter-page.html` - Scout 템플릿
- `service-details.html`, `service1-4-details.html` - 서비스 상세 페이지
- `product-inquiry.html`, `technical-support.html` - 문의 페이지

### 📁 management/
- `main-page-management.html` - 메인 페이지 관리
- `homepage-management.html` - 홈페이지 관리
- `detail-page-management.html` - 상세 페이지 관리
- `instant-homepage-management.html` - 즉석 홈페이지 관리

### 📁 assets/
- `assets/` - CSS, JS, 이미지 등 웹 자원
- `shared-assets/` - 공유 자원
- CSS, JS 파일들

## 2. 회원관리 관련파일 (2-member-management/)
각 회사의 직원 부서, 직책, 권한 설정

### 📁 admin/
- `admin-dashboard.html` - 관리자 대시보드
- `admin-settings.html` - 관리자 설정
- `company-admin.html` - 회사 관리자
- `platform-admin.html` - 플랫폼 관리자
- `master-dashboard.html` - 마스터 대시보드
- `instant-admin-dashboard.html` - 즉석 관리자 대시보드

### 📁 employee/
- `employee-dashboard.html` - 직원 대시보드
- `company-detail.html`, `company-detail.js` - 회사 상세 정보
- `company-list.html`, `company-list.js` - 회사 목록
- `company-register.html`, `company-register.js` - 회사 등록

## 3. 업무관련 파일 (3-business-files/)
직원 권한에 따른 업무 서류 및 일지 관리

### 📁 reports/
- `business-trip-report.html` - 출장 보고서
- `incident-report.html` - 사고 보고서
- `proposal.html` - 제안서

### 📁 documents/
- `documents.html` - 문서 관리
- `career-certificate.html` - 경력증명서
- `employment-certificate.html` - 재직증명서
- `leave-request.html` - 휴가 신청서
- `resignation-letter.html` - 사직서
- `corporate-card.html` - 법인카드

### 📁 applications/
- `work-log.js` - 업무일지 애플리케이션
- `works/` - 업무 관련 애플리케이션들

## 시스템 목표

1. **홈페이지**: 각 회사가 쉽게 커스터마이징 가능
2. **회원관리**: 부서/직책/권한 기반 직원 관리 시스템
3. **업무파일**: 권한에 따른 업무 서류 접근 및 작성 시스템

모든 시스템은 `employee-dashboard.html`을 통해 통합 관리됩니다.
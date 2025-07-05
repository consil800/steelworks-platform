// 권한 관리 시스템
const AuthManager = {
    // 사용자 역할 정의
    ROLES: {
        MASTER: 'master',
        COMPANY_ADMIN: 'company_admin',
        COMPANY_MANAGER: 'company_manager',
        EMPLOYEE: 'employee'
    },

    // 권한 정의
    PERMISSIONS: {
        // 마스터 권한
        MANAGE_ALL_COMPANIES: 'manage_all_companies',
        MANAGE_ALL_USERS: 'manage_all_users',
        SYSTEM_SETTINGS: 'system_settings',
        
        // 회사 관리자 권한
        MANAGE_COMPANY_HOMEPAGE: 'manage_company_homepage',
        MANAGE_COMPANY_EMPLOYEES: 'manage_company_employees',
        MANAGE_EMPLOYEE_SYSTEMS: 'manage_employee_systems',
        VIEW_COMPANY_ANALYTICS: 'view_company_analytics',
        
        // 직원 권한
        ACCESS_EMPLOYEE_DASHBOARD: 'access_employee_dashboard',
        CREATE_WORK_LOG: 'create_work_log',
        ACCESS_SALES_SYSTEM: 'access_sales_system',
        VIEW_TEAM_DATA: 'view_team_data'
    },

    // 역할별 권한 매핑
    ROLE_PERMISSIONS: {
        master: [
            'manage_all_companies',
            'manage_all_users',
            'system_settings',
            'manage_company_homepage',
            'manage_company_employees',
            'manage_employee_systems',
            'view_company_analytics',
            'access_employee_dashboard',
            'create_work_log',
            'access_sales_system',
            'view_team_data'
        ],
        company_admin: [
            'manage_company_homepage',
            'manage_company_employees',
            'manage_employee_systems',
            'view_company_analytics',
            'access_employee_dashboard',
            'create_work_log',
            'access_sales_system',
            'view_team_data'
        ],
        company_manager: [
            'manage_company_homepage',
            'manage_company_employees',
            'manage_employee_systems',
            'view_company_analytics',
            'access_employee_dashboard',
            'create_work_log',
            'access_sales_system',
            'view_team_data'
        ],
        employee: [
            'access_employee_dashboard',
            'create_work_log',
            'access_sales_system',
            'view_team_data'
        ]
    },

    // 현재 사용자 정보 가져오기
    getCurrentUser() {
        const userJson = localStorage.getItem('currentUser');
        if (!userJson) return null;
        
        try {
            return JSON.parse(userJson);
        } catch (e) {
            return null;
        }
    },

    // 로그인
    login(email, password, role = 'employee') {
        // 실제 환경에서는 서버 API 호출
        // 여기서는 데모를 위한 하드코딩
        const users = {
            'master@steelworks.com': {
                id: 1,
                name: '마스터 관리자',
                email: 'master@steelworks.com',
                role: 'master',
                company: null
            },
            'ceo@seokyoung.com': {
                id: 2,
                name: '고강석',
                email: 'ceo@seokyoung.com',
                role: 'company_admin',
                company: 'seokyoung-snt',
                position: '대표이사'
            },
            'manager1@seokyoung.com': {
                id: 3,
                name: '이원석',
                email: 'manager1@seokyoung.com',
                role: 'company_manager',
                company: 'seokyoung-snt',
                position: '기술이사'
            },
            'manager2@seokyoung.com': {
                id: 4,
                name: '박성민',
                email: 'manager2@seokyoung.com',
                role: 'company_manager',
                company: 'seokyoung-snt',
                position: '영업이사'
            },
            'employee1@seokyoung.com': {
                id: 5,
                name: '이영희',
                email: 'employee1@seokyoung.com',
                role: 'employee',
                company: 'seokyoung-snt',
                department: '영업팀',
                position: '직원'
            },
            'employee2@seokyoung.com': {
                id: 6,
                name: '박준호',
                email: 'employee2@seokyoung.com',
                role: 'employee',
                company: 'seokyoung-snt',
                department: '영업팀',
                position: '직원'
            }
        };

        const user = users[email];
        let isValidPassword = false;
        
        // 마스터 계정은 특별한 비밀번호
        if (email === 'master@steelworks.com' && password === 'steelmaster2025') {
            isValidPassword = true;
        }
        // 다른 계정들은 기존 비밀번호
        else if (user && (password === 'demo123' || password === 'admin123')) {
            isValidPassword = true;
        }
        
        if (user && isValidPassword) {
            const userWithPermissions = {
                ...user,
                permissions: this.ROLE_PERMISSIONS[user.role]
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userWithPermissions));
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('userName', user.name);
            
            return { success: true, user: userWithPermissions };
        }

        return { success: false, message: '잘못된 이메일 또는 비밀번호입니다.' };
    },

    // 로그아웃
    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        window.location.href = '../../1-homepage/templates/index.html';
    },

    // 권한 확인
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user || !user.permissions) return false;
        
        return user.permissions.includes(permission);
    },

    // 역할 확인
    hasRole(role) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        return user.role === role;
    },

    // 회사 확인
    belongsToCompany(companyId) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        // 마스터는 모든 회사 접근 가능
        if (user.role === 'master') return true;
        
        return user.company === companyId;
    },

    // 페이지 접근 권한 확인
    canAccessPage(page) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const pagePermissions = {
            'master-dashboard': ['master'],
            'company-admin': ['master', 'company_admin', 'company_manager'],
            'employee-workspace': ['master', 'company_admin', 'company_manager', 'employee'],
            'sales-system': ['master', 'company_admin', 'company_manager', 'employee']
        };

        const allowedRoles = pagePermissions[page] || [];
        return allowedRoles.includes(user.role);
    },

    // 리다이렉트 처리
    redirectToAppropriatePanel() {
        const user = this.getCurrentUser();
        console.log('리다이렉트 처리 중인 사용자:', user);
        
        if (!user) {
            window.location.href = '../../1-homepage/templates/index.html';
            return;
        }

        switch (user.role) {
            case 'master':
                console.log('마스터 대시보드로 이동');
                window.location.href = '../../2-member-management/admin/master-dashboard.html';
                break;
            case 'company_admin':
            case 'company_manager':
                console.log('회사 관리자 대시보드로 이동');
                window.location.href = '../../2-member-management/employee/employee-dashboard.html';
                break;
            case 'employee':
                console.log('직원 시스템으로 이동');
                // steel-business-app으로 리다이렉트
                window.location.href = `../../steel-business-app/index.html`;
                break;
            default:
                console.log('기본 페이지로 이동');
                window.location.href = '../../1-homepage/templates/index.html';
        }
    },

    // 데모 로그인 함수들
    loginDemo(type) {
        console.log('loginDemo 호출됨, type:', type);
        let result;
        switch (type) {
            case 'master':
                result = this.login('master@steelworks.com', 'demo123');
                break;
            case 'admin':
                result = this.login('ceo@seokyoung.com', 'demo123');
                break;
            case 'customer':
                result = this.login('manager1@seokyoung.com', 'demo123');
                break;
            case 'manager':
                result = this.login('manager1@seokyoung.com', 'demo123');
                break;
            case 'employee':
                result = this.login('employee1@seokyoung.com', 'demo123');
                break;
            default:
                result = { success: false, message: '알 수 없는 로그인 타입입니다.' };
        }
        console.log('loginDemo 결과:', result);
        return result;
    }
};

// 전역 함수로 내보내기
window.AuthManager = AuthManager;
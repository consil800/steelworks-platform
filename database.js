// Supabase 데이터베이스 연결 및 관리
// 이 파일은 모든 데이터베이스 작업을 위한 중앙 집중식 관리를 제공합니다

// Supabase 설정 (실제 사용 시 환경변수로 관리해야 합니다)
const SUPABASE_URL = 'https://yanthcxoctifnhpekzgg.supabase.co'; // 실제 Supabase URL로 변경
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnRoY3hvY3RpZm5ocGVremdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDg2MTUsImV4cCI6MjA2NzI4NDYxNX0.8kEkPCfQQ_NXmQhgazmud2YbR1RYDwon7OPJJTRopzo'; // 실제 Supabase anon key로 변경

// Supabase 클라이언트 초기화
let supabaseClient = null;

// Supabase 클라이언트 초기화 함수
async function initSupabase() {
    if (!supabaseClient) {
        // CDN에서 Supabase 클라이언트 로드
        if (typeof supabase === 'undefined') {
            console.warn('Supabase 라이브러리가 로드되지 않았습니다. 로컬 저장소 모드로 실행됩니다.');
            return null;
        }
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (error) {
            console.warn('Supabase 연결 실패, 로컬 저장소 모드로 실행됩니다:', error);
            return null;
        }
    }
    return supabaseClient;
}

// 데이터베이스 매니저 클래스 (멀티 테넌트 지원)
class DatabaseManager {
    constructor() {
        this.client = null;
        this.currentDomain = null;
        this.init();
    }

    async init() {
        try {
            this.client = await initSupabase();
            // 도메인 매니저가 있으면 현재 도메인 설정
            if (typeof domainManager !== 'undefined') {
                this.currentDomain = domainManager.getCurrentDomain();
            }
        } catch (error) {
            console.error('Supabase 초기화 오류:', error);
            // 오류 시 로컬스토리지로 폴백
            this.client = null;
        }
    }

    // 현재 도메인 설정
    setCurrentDomain(domain) {
        this.currentDomain = domain;
    }

    // 현재 도메인 가져오기
    getCurrentDomain() {
        return this.currentDomain;
    }

    // 회사 관리 (Companies)
    async getCompanies() {
        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('companies')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('회사 목록 조회 오류:', error);
            }
        }
        
        // 로컬 저장소 폴백
        return JSON.parse(localStorage.getItem('companies') || '[]');
    }

    async createCompany(companyData) {
        const company = {
            company_name: companyData.companyName || companyData.company_name,
            domain: companyData.domain,
            website: companyData.website || '',
            email: companyData.email || '',
            phone: companyData.phone || '',
            address: companyData.address || '',
            subscription_plan: companyData.subscription_plan || 'basic',
            is_active: true,
            created_at: new Date().toISOString()
        };

        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('companies')
                    .insert([company])
                    .select();
                
                if (error) throw error;
                return { success: true, data: data[0] };
            } catch (error) {
                console.error('회사 생성 오류:', error);
            }
        }
        
        // 로컬 저장소 폴백
        const companies = JSON.parse(localStorage.getItem('companies') || '[]');
        company.id = Date.now();
        companies.push(company);
        localStorage.setItem('companies', JSON.stringify(companies));
        return { success: true, data: company };
    }

    async updateCompany(domain, updateData) {
        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('companies')
                    .update(updateData)
                    .eq('domain', domain)
                    .select();
                
                if (error) throw error;
                return { success: true, data: data[0] };
            } catch (error) {
                console.error('회사 업데이트 오류:', error);
            }
        }
        
        // 로컬 저장소 폴백
        const companies = JSON.parse(localStorage.getItem('companies') || '[]');
        const companyIndex = companies.findIndex(c => c.domain === domain);
        if (companyIndex !== -1) {
            companies[companyIndex] = { ...companies[companyIndex], ...updateData };
            localStorage.setItem('companies', JSON.stringify(companies));
            return { success: true, data: companies[companyIndex] };
        }
        return { success: false, error: '회사를 찾을 수 없습니다.' };
    }

    async deleteCompany(domain) {
        if (this.client) {
            try {
                const { error } = await this.client
                    .from('companies')
                    .delete()
                    .eq('domain', domain);
                
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('회사 삭제 오류:', error);
                return { success: false, error: error.message };
            }
        }
        
        // 로컬 저장소 폴백
        const companies = JSON.parse(localStorage.getItem('companies') || '[]');
        const filteredCompanies = companies.filter(c => c.domain !== domain);
        localStorage.setItem('companies', JSON.stringify(filteredCompanies));
        return { success: true };
    }

    // 사용자 관리 (Users)
    async getUsers(companyDomain = null) {
        if (this.client) {
            try {
                let query = this.client.from('users').select('*');
                
                if (companyDomain) {
                    query = query.eq('company_domain', companyDomain);
                }
                
                const { data, error } = await query.order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('사용자 목록 조회 오류:', error);
            }
        }
        
        // 로컬 저장소 폴백
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (companyDomain) {
            return users.filter(u => u.company_domain === companyDomain);
        }
        return users;
    }

    async createUser(userData) {
        const user = {
            username: userData.username || userData.email,
            email: userData.email,
            password: userData.password,
            name: userData.name,
            phone: userData.phone || '',
            department: userData.department || '',
            position: userData.position || '',
            role: userData.role || 'employee',
            company_domain: userData.company_domain || this.currentDomain,
            is_active: true,
            created_at: new Date().toISOString()
        };

        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('users')
                    .insert([user])
                    .select();
                
                if (error) throw error;
                return { success: true, data: data[0] };
            } catch (error) {
                console.error('사용자 생성 오류:', error);
                return { success: false, error: error.message };
            }
        }
        
        // 로컬 저장소 폴백
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        user.id = Date.now();
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        
        // 회원가입용 별도 저장소에도 저장
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        registeredUsers.push(user);
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        
        return { success: true, data: user };
    }

    async updateUser(userId, updateData) {
        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('users')
                    .update(updateData)
                    .eq('id', userId)
                    .select();
                
                if (error) throw error;
                return { success: true, data: data[0] };
            } catch (error) {
                console.error('사용자 업데이트 오류:', error);
                return { success: false, error: error.message };
            }
        }
        
        // 로컬 저장소 폴백
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id == userId);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updateData };
            localStorage.setItem('users', JSON.stringify(users));
            return { success: true, data: users[userIndex] };
        }
        return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    async deleteUser(userId) {
        if (this.client) {
            try {
                const { error } = await this.client
                    .from('users')
                    .delete()
                    .eq('id', userId);
                
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('사용자 삭제 오류:', error);
                return { success: false, error: error.message };
            }
        }
        
        // 로컬 저장소 폴백
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const filteredUsers = users.filter(u => u.id != userId);
        localStorage.setItem('users', JSON.stringify(filteredUsers));
        return { success: true };
    }

    // 업무 일지 관리 (Work Logs)
    async getWorkLogs(userId = null, startDate = null, endDate = null) {
        const key = `workLogs_${userId || 'all'}`;
        
        if (this.client) {
            try {
                let query = this.client.from('work_logs').select('*');
                
                if (userId) query = query.eq('user_id', userId);
                if (startDate) query = query.gte('work_date', startDate);
                if (endDate) query = query.lte('work_date', endDate);
                
                const { data, error } = await query.order('work_date', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('업무 일지 조회 오류:', error);
            }
        }
        
        // 로컬 저장소 폴백
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    async createWorkLog(workLogData) {
        const workLog = {
            user_id: workLogData.user_id || workLogData.userId,
            company_domain: workLogData.company_domain || this.currentDomain,
            work_date: workLogData.work_date || workLogData.date,
            start_time: workLogData.start_time || workLogData.startTime,
            end_time: workLogData.end_time || workLogData.endTime,
            break_time: workLogData.break_time || workLogData.breakTime || 0,
            tasks: JSON.stringify(workLogData.tasks || []),
            notes: workLogData.notes || '',
            created_at: new Date().toISOString()
        };

        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('work_logs')
                    .insert([workLog])
                    .select();
                
                if (error) throw error;
                return { success: true, data: data[0] };
            } catch (error) {
                console.error('업무 일지 생성 오류:', error);
                return { success: false, error: error.message };
            }
        }
        
        // 로컬 저장소 폴백
        const key = `workLogs_${workLog.user_id}`;
        const workLogs = JSON.parse(localStorage.getItem(key) || '[]');
        workLog.id = Date.now();
        workLogs.push(workLog);
        localStorage.setItem(key, JSON.stringify(workLogs));
        return { success: true, data: workLog };
    }

    // 인증 관련
    async authenticateUser(email, password) {
        // 먼저 registeredUsers에서 확인
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const registeredUser = registeredUsers.find(u => u.email === email && u.password === password);
        
        if (registeredUser) {
            return { success: true, user: registeredUser };
        }

        // 기존 사용자 데이터에서 확인
        const users = await this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            return { success: true, user: user };
        }
        
        return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }

    // 통계 정보
    async getStatistics() {
        const companies = await this.getCompanies();
        const users = await this.getUsers();
        
        return {
            totalCompanies: companies.length,
            totalUsers: users.length,
            activeCompanies: companies.filter(c => c.is_active !== false).length,
            usersByRole: {
                master: users.filter(u => u.role === 'master').length,
                company_admin: users.filter(u => u.role === 'company_admin').length,
                company_manager: users.filter(u => u.role === 'company_manager').length,
                employee: users.filter(u => u.role === 'employee').length
            }
        };
    }

    // 데이터 동기화 (로컬 저장소 → Supabase)
    async syncLocalToSupabase() {
        if (!this.client) {
            console.warn('Supabase 클라이언트가 연결되지 않았습니다.');
            return { success: false, error: 'Supabase 연결 없음' };
        }

        try {
            // 회사 데이터 동기화
            const localCompanies = JSON.parse(localStorage.getItem('companies') || '[]');
            for (const company of localCompanies) {
                await this.createCompany(company);
            }

            // 사용자 데이터 동기화
            const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            for (const user of [...localUsers, ...registeredUsers]) {
                await this.createUser(user);
            }

            return { success: true, message: '로컬 데이터가 Supabase에 동기화되었습니다.' };
        } catch (error) {
            console.error('동기화 오류:', error);
            return { success: false, error: error.message };
        }
    }
}

// 전역 데이터베이스 매니저 인스턴스
const db = new DatabaseManager();

// 전역 함수로 내보내기
window.db = db;

// 초기화 완료 후 이벤트 발생
document.addEventListener('DOMContentLoaded', function() {
    // 데이터베이스 연결 상태 확인
    setTimeout(() => {
        if (db.client) {
            console.log('✅ Supabase 데이터베이스 연결됨');
        } else {
            console.log('⚠️ 로컬 저장소 모드로 실행 중');
        }
    }, 1000);
});
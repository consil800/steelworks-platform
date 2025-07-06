// Supabase 데이터베이스 연결 및 관리
// 이 파일은 모든 데이터베이스 작업을 위한 중앙 집중식 관리를 제공합니다

// Supabase 설정 (환경변수로 관리 권장)
const SUPABASE_URL = 'https://zgyawfmjconubxaiamod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpneWF3Zm1qY29udWJ4YWlhbW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjQzNzIsImV4cCI6MjA2NzM0MDM3Mn0.shjBE2OQeILwkLLi4E6Bq0-b6YPUs-WFwquexdUiM9A';
// Supabase 클라이언트 초기화
let supabaseClient = null;

// Supabase 클라이언트 초기화 함수
async function initSupabase() {
    if (!supabaseClient) {
        // CDN에서 Supabase 클라이언트 로드
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase 라이브러리가 로드되지 않았습니다. 데이터베이스 연결이 필요합니다.');
        }
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (error) {
            throw new Error('Supabase 연결 실패: ' + error.message);
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
            throw error;
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
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }
        
        try {
            const { data, error } = await this.client
                .from('companies')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('회사 목록 조회 오류:', error);
            throw error;
        }
    }

    async createCompany(companyData) {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }

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

        try {
            const { data, error } = await this.client
                .from('companies')
                .insert([company])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('회사 생성 오류:', error);
            throw error;
        }
    }

    async updateCompany(domain, updateData) {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }

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
            throw error;
        }
    }

    async deleteCompany(domain) {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }

        try {
            const { error } = await this.client
                .from('companies')
                .delete()
                .eq('domain', domain);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('회사 삭제 오류:', error);
            throw error;
        }
    }

    // 사용자 관리 (Users)
    async getUsers(companyDomain = null) {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }

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
            throw error;
        }
    }

    async createUser(userData) {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }

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

        try {
            const { data, error } = await this.client
                .from('users')
                .insert([user])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('사용자 생성 오류:', error);
            throw error;
        }
    }

    async updateUser(userId, updateData) {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }

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
            throw error;
        }
    }

    async deleteUser(userId) {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }

        try {
            const { error } = await this.client
                .from('users')
                .delete()
                .eq('id', userId);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('사용자 삭제 오류:', error);
            throw error;
        }
    }

    // 직원 관리 (Employees)
    async getEmployees(companyId = null) {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }

        try {
            let query = this.client.from('users').select('*');
            
            if (companyId) {
                query = query.eq('companyId', companyId);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // 데이터 형식 변환 (DB 스키마에 맞게)
            const employees = data.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                position: user.position,
                phone: user.phone,
                profileImage: user.profile_image,
                companyId: user.company_domain || companyId,
                createdAt: user.created_at,
                updatedAt: user.updated_at || user.created_at
            }));
            
            return employees;
        } catch (error) {
            console.error('직원 목록 조회 오류:', error);
            throw error;
        }
    }

    // 업무 일지 관리 (Work Logs)
    async getWorkLogs(userId = null, startDate = null, endDate = null) {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }

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
            throw error;
        }
    }

    async createWorkLog(workLogData) {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }

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

        try {
            const { data, error } = await this.client
                .from('work_logs')
                .insert([workLog])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('업무 일지 생성 오류:', error);
            throw error;
        }
    }

    // 인증 관련
    async authenticateUser(email, password) {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }

        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .eq('is_active', true)
                .single();
            
            if (error) {
                if (error.code === 'PGRST116') {
                    return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
                }
                throw error;
            }
            
            return { success: true, user: data };
        } catch (error) {
            console.error('인증 오류:', error);
            throw error;
        }
    }

    // 통계 정보
    async getStatistics() {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }

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

    // 데이터베이스 연결 상태 확인
    isConnected() {
        return !!this.client;
    }

    // 연결 상태 확인 후 에러 처리
    async ensureConnection() {
        if (!this.client) {
            throw new Error('데이터베이스 연결이 필요합니다. Supabase 클라이언트를 초기화해주세요.');
        }
        return this.client;
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
            console.error('❌ 데이터베이스 연결 실패 - 모든 데이터베이스 작업이 실패합니다.');
        }
    }, 1000);
});

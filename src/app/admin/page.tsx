'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OfficeFormModal from '@/components/OfficeFormModal'
import RewardFormModal from '@/components/RewardFormModal'
import ClientPointsModal from '@/components/ClientPointsModal'
import SubscriptionFormModal from '@/components/SubscriptionFormModal'
import PointsConfigModal from '@/components/PointsConfigModal'

interface DashboardStats {
  totalOffices: number
  availableOffices: number
  occupiedOffices: number
  totalClients: number
  activeSubscriptions: number
  totalBookings: number
  totalRedemptions: number
}

interface RecentActivity {
  bookings: Array<{
    id: string
    user: string
    office: string
    totalPrice: number
    status: string
    createdAt: string
  }>
  redemptions: Array<{
    id: string
    user: string
    reward: string
    pointsUsed: number
    status: string
    createdAt: string
  }>
}

interface Office {
  id: string
  officeNumber?: string
  name: string
  description: string
  capacity: number
  pricePerHour: number
  pricePerDay: number
  pricePerWeek: number
  pricePerMonth: number
  renewalPricePerHour?: number
  renewalPricePerDay?: number
  renewalPricePerWeek?: number
  renewalPricePerMonth?: number
  discountPercentage: number
  isAvailable: boolean
  // أسعار سابقة لحساب الخصم
  previousPricePerHour?: number | null
  previousPricePerDay?: number | null
  previousPricePerMonth?: number | null
  // أسعار تجديد سابقة
  previousRenewalPricePerHour?: number | null
  previousRenewalPricePerDay?: number | null
  previousRenewalPricePerMonth?: number | null
}

interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsCost: number
  pointsRequired?: number // For form compatibility
  type: 'PHYSICAL' | 'TIME_EXTENSION'
  timeValue?: number
  timeUnit?: 'HOURS' | 'DAYS'
  isActive: boolean
}

interface PointsConfig {
  id: string
  action: string
  points: number
  description: string
  isActive: boolean
}

interface Client {
  id: string
  phone: string
  username: string | null
  loyaltyPoints: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    bookings: number
    subscriptions: number
    redemptions: number
  }
  bookings?: Array<{
    id: string
    bookingCode: string
    duration: string
    status: string
    createdAt: string
    office: {
      id: string
      name: string
      officeNumber: string | null
    }
  }>
  subscriptions?: Array<{
    id: string
    packageType: string
    status: string
    startDate: string
    endDate: string
    office: {
      id: string
      name: string
      officeNumber: string | null
    }
  }>
}

interface Subscription {
  id: string
  userId: string
  officeId: string
  duration: string
  startDate: string
  endDate: string
  totalPrice: number
  status: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    phone: string
    username: string | null
    loyaltyPoints: number
  }
  office: {
    id: string
    name: string
    officeNumber: string | null
    capacity: number
  }
}

interface Client {
  id: string
  phone: string
  loyaltyPoints: number
  isActive: boolean
  createdAt: string
  _count: {
    bookings: number
    subscriptions: number
    redemptions: number
  }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'offices' | 'rewards' | 'clients' | 'subscriptions' | 'points'>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null)
  const [offices, setOffices] = useState<Office[]>([])
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [pointsConfigs, setPointsConfigs] = useState<PointsConfig[]>([])
  const [editingPointsConfig, setEditingPointsConfig] = useState<PointsConfig | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showOfficeForm, setShowOfficeForm] = useState(false)
  const [showRewardForm, setShowRewardForm] = useState(false)
  const [showClientPointsModal, setShowClientPointsModal] = useState(false)
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false)
  const [editingOffice, setEditingOffice] = useState<Office | null>(null)
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'dashboard':
          const dashboardRes = await fetch('/api/admin/dashboard')
          if (dashboardRes.ok) {
            const data = await dashboardRes.json()
            setStats(data.stats)
            setRecentActivity(data.recentActivity)
          }
          break
        case 'offices':
          const officesRes = await fetch('/api/admin/offices')
          if (officesRes.ok) {
            const data = await officesRes.json()
            setOffices(data.offices)
          }
          break
        case 'rewards':
          const rewardsRes = await fetch('/api/admin/rewards')
          if (rewardsRes.ok) {
            const data = await rewardsRes.json()
            setRewards(data.rewards)
          }
          break
        case 'clients':
          const clientsRes = await fetch('/api/admin/clients')
          if (clientsRes.ok) {
            const data = await clientsRes.json()
            setClients(data.clients)
          }
          break
        case 'subscriptions':
          const subscriptionsRes = await fetch('/api/admin/subscriptions')
          if (subscriptionsRes.ok) {
            const data = await subscriptionsRes.json()
            setSubscriptions(data.subscriptions)
          }
          // Also fetch offices and clients for the form
          const officesForSubRes = await fetch('/api/admin/offices')
          if (officesForSubRes.ok) {
            const officesData = await officesForSubRes.json()
            setOffices(officesData.offices)
          }
          const clientsForSubRes = await fetch('/api/admin/clients')
          if (clientsForSubRes.ok) {
            const clientsData = await clientsForSubRes.json()
            setClients(clientsData.clients)
          }
          break
        case 'points':
          const pointsRes = await fetch('/api/admin/points-config')
          if (pointsRes.ok) {
            const data = await pointsRes.json()
            setPointsConfigs(data.pointsConfigs)
          }
          break
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const handleDeleteOffice = async (officeId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المكتب؟')) return

    try {
      console.log('🗑️ Deleting office:', officeId)

      const response = await fetch('/api/admin/offices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: officeId })
      })

      if (response.ok) {
        console.log('✅ Office deleted successfully')
        fetchData() // Refresh the data
        alert('تم حذف المكتب بنجاح!')
      } else {
        const error = await response.json()
        console.error('❌ Failed to delete office:', error)
        alert(error.error || 'فشل في حذف المكتب')
      }
    } catch (error) {
      console.error('❌ Network error:', error)
      alert('حدث خطأ في الشبكة. حاول مرة أخرى.')
    }
  }

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المكافأة؟')) return

    try {
      console.log('🗑️ Deleting reward:', rewardId)

      const response = await fetch('/api/admin/rewards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rewardId })
      })

      if (response.ok) {
        console.log('✅ Reward deleted successfully')
        fetchData() // Refresh the data
        alert('تم حذف المكافأة بنجاح!')
      } else {
        const error = await response.json()
        console.error('❌ Failed to delete reward:', error)
        alert(error.error || 'فشل في حذف المكافأة')
      }
    } catch (error) {
      console.error('❌ Network error:', error)
      alert('حدث خطأ في الشبكة. حاول مرة أخرى.')
    }
  }

  const handleUpdateClientPoints = async (clientData: { id: string; loyaltyPoints: number; action: string }) => {
    try {
      console.log('💎 Updating client points:', clientData)

      const response = await fetch('/api/admin/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Client points updated successfully:', result)

        setShowClientPointsModal(false)
        setEditingClient(null)
        fetchData() // Refresh the data

        alert(result.message || 'تم تحديث نقاط العميل بنجاح!')
      } else {
        const error = await response.json()
        console.error('❌ Failed to update client points:', error)
        alert(error.error || 'فشل في تحديث نقاط العميل')
      }
    } catch (error) {
      console.error('❌ Network error:', error)
      alert('حدث خطأ في الشبكة. حاول مرة أخرى.')
    }
  }

  const handleUpdatePointsConfig = async (pointsData: { id: string; points: number; description: string; isActive: boolean }) => {
    try {
      console.log('⚙️ Updating points config:', pointsData)

      const response = await fetch('/api/admin/points-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pointsData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Points config updated successfully:', result)

        setEditingPointsConfig(null)
        fetchData() // Refresh the data

        alert(result.message || 'تم تحديث إعدادات النقاط بنجاح!')
      } else {
        const error = await response.json()
        console.error('❌ Failed to update points config:', error)
        alert(error.error || 'فشل في تحديث إعدادات النقاط')
      }
    } catch (error) {
      console.error('❌ Network error:', error)
      alert('حدث خطأ في الشبكة. حاول مرة أخرى.')
    }
  }

  const handleSaveSubscription = async (subscriptionData: any) => {
    try {
      const method = editingSubscription ? 'PUT' : 'POST'
      const body = editingSubscription ? { ...subscriptionData, id: editingSubscription.id } : subscriptionData

      console.log('📋 Saving subscription data:', body)

      const response = await fetch('/api/admin/subscriptions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Subscription saved successfully:', result)

        setShowSubscriptionForm(false)
        setEditingSubscription(null)
        fetchData() // Refresh the data

        alert(result.message || (editingSubscription ? 'تم تحديث الاشتراك بنجاح!' : 'تم إضافة الاشتراك بنجاح!'))
      } else {
        const error = await response.json()
        console.error('❌ Failed to save subscription:', error)
        console.error('❌ Response status:', response.status)

        alert(error.error || `فشل في حفظ الاشتراك (${response.status})`)
      }
    } catch (error) {
      console.error('❌ Network error:', error)
      alert('حدث خطأ في الشبكة. حاول مرة أخرى.')
    }
  }

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) return

    try {
      console.log('🗑️ Deleting subscription:', subscriptionId)

      const response = await fetch('/api/admin/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subscriptionId })
      })

      if (response.ok) {
        console.log('✅ Subscription deleted successfully')
        fetchData() // Refresh the data
        alert('تم حذف الاشتراك بنجاح!')
      } else {
        const error = await response.json()
        console.error('❌ Failed to delete subscription:', error)
        alert(error.error || 'فشل في حذف الاشتراك')
      }
    } catch (error) {
      console.error('❌ Network error:', error)
      alert('حدث خطأ في الشبكة. حاول مرة أخرى.')
    }
  }

  const handleSaveOffice = async (officeData: Partial<Office>) => {
    try {
      const method = editingOffice ? 'PUT' : 'POST'
      const body = editingOffice ? { ...officeData, id: editingOffice.id } : officeData

      console.log('Saving office data:', body)

      const response = await fetch('/api/admin/offices', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Office saved successfully:', result)

        setShowOfficeForm(false)
        setEditingOffice(null)
        fetchData() // Refresh the data

        alert(result.message || (editingOffice ? 'تم تحديث المكتب بنجاح!' : 'تم إضافة المكتب بنجاح!'))
      } else {
        const error = await response.json()
        console.error('❌ Failed to save office:', error)
        console.error('❌ Response status:', response.status)
        console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()))

        alert(error.error || `فشل في حفظ المكتب (${response.status})`)
      }
    } catch (error) {
      console.error('Network error:', error)
      alert('حدث خطأ في الشبكة. حاول مرة أخرى.')
    }
  }



  const handleSaveReward = async (rewardData: Partial<LoyaltyReward>) => {
    try {
      const method = editingReward ? 'PUT' : 'POST'
      const body = editingReward ? { ...rewardData, id: editingReward.id } : rewardData

      console.log('Saving reward data:', body)

      const response = await fetch('/api/admin/rewards', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Reward saved successfully:', result)

        setShowRewardForm(false)
        setEditingReward(null)
        fetchData() // Refresh the data

        alert(result.message || (editingReward ? 'تم تحديث المكافأة بنجاح!' : 'تم إضافة المكافأة بنجاح!'))
      } else {
        const error = await response.json()
        console.error('❌ Failed to save reward:', error)
        console.error('❌ Response status:', response.status)

        alert(error.error || `فشل في حفظ المكافأة (${response.status})`)
      }
    } catch (error) {
      console.error('❌ Network error:', error)
      alert('حدث خطأ في الشبكة. حاول مرة أخرى.')
    }
  }



  const handleUpdateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const response = await fetch('/api/admin/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })

      if (response.ok) {
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update client')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم الإدارة 👨‍💼</h1>
              <p className="text-sm text-gray-600">إدارة أعمال مساحة العمل المشتركة</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              تسجيل الخروج 🚪
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-reverse space-x-8">
              {[
                { id: 'dashboard', label: 'لوحة التحكم 📊' },
                { id: 'offices', label: 'المكاتب 🏢' },
                { id: 'rewards', label: 'المكافآت 🎁' },
                { id: 'points', label: 'إدارة النقاط ⚙️' },
                { id: 'clients', label: 'العملاء 👥' },
                { id: 'subscriptions', label: 'الاشتراكات 📋' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border-r-4 border-blue-500">
                <h3 className="text-sm font-medium text-gray-500">إجمالي المكاتب 🏢</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOffices}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-r-4 border-green-500">
                <h3 className="text-sm font-medium text-gray-500">المتاحة ✅</h3>
                <p className="text-2xl font-bold text-green-600">{stats.availableOffices}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-r-4 border-red-500">
                <h3 className="text-sm font-medium text-gray-500">المحجوزة 🔒</h3>
                <p className="text-2xl font-bold text-red-600">{stats.occupiedOffices}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-r-4 border-blue-500">
                <h3 className="text-sm font-medium text-gray-500">إجمالي العملاء 👥</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.totalClients}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-r-4 border-purple-500">
                <h3 className="text-sm font-medium text-gray-500">الاشتراكات النشطة 📋</h3>
                <p className="text-2xl font-bold text-purple-600">{stats.activeSubscriptions}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-r-4 border-indigo-500">
                <h3 className="text-sm font-medium text-gray-500">حجوزات هذا الشهر 📅</h3>
                <p className="text-2xl font-bold text-indigo-600">{stats.totalBookings}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-r-4 border-yellow-500">
                <h3 className="text-sm font-medium text-gray-500">استبدال المكافآت 🎁</h3>
                <p className="text-2xl font-bold text-yellow-600">{stats.totalRedemptions}</p>
              </div>
            </div>

            {/* Recent Activity */}
            {recentActivity && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Bookings */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">الحجوزات الحديثة 📋</h3>
                  </div>
                  <div className="p-6">
                    {recentActivity.bookings.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivity.bookings.map((booking) => (
                          <div key={booking.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{booking.user}</p>
                              <p className="text-sm text-gray-600">{booking.office}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${booking.totalPrice}</p>
                              <p className="text-sm text-gray-600">{booking.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No recent bookings</p>
                    )}
                  </div>
                </div>

                {/* Recent Redemptions */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">استبدال المكافآت الحديثة 🎁</h3>
                  </div>
                  <div className="p-6">
                    {recentActivity.redemptions.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivity.redemptions.map((redemption) => (
                          <div key={redemption.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{redemption.user}</p>
                              <p className="text-sm text-gray-600">{redemption.reward}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{redemption.pointsUsed} pts</p>
                              <p className="text-sm text-gray-600">{redemption.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">لا توجد عمليات استبدال حديثة</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Offices Tab */}
        {activeTab === 'offices' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">إدارة المكاتب 🏢</h2>
              <button
                onClick={() => setShowOfficeForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                إضافة مكتب جديد ➕
              </button>
            </div>

            {/* نظام الخصومات الجديد - رسالة توضيحية */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="mr-3">
                  <h3 className="text-sm font-medium text-blue-800">💡 نظام الخصومات الجديد</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>• الخصومات تُحسب تلقائياً من الأسعار السابقة والحالية</p>
                    <p>• يمكن تحديد خصم مختلف لكل باقة (ساعة، يوم، شهر)</p>
                    <p>• إذا لم تُحدد أسعار سابقة، لن يظهر خصم</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم المكتب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اسم المكتب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      السعة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الأسعار
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الخصومات
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {offices.map((office) => (
                    <tr key={office.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-blue-600">
                          {office.officeNumber || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">{office.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {office.capacity} شخص
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">ساعة:</span>
                            <div className="text-right">
                              {office.previousPricePerHour && office.previousPricePerHour > office.pricePerHour ? (
                                <div>
                                  <span className="text-gray-400 line-through text-xs">{office.previousPricePerHour}</span>
                                  <span className="text-red-600 font-bold mr-1">{office.pricePerHour}</span>
                                </div>
                              ) : (
                                <span className="text-gray-900">{office.pricePerHour}</span>
                              )}
                              <span className="text-gray-500"> ريال</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">يوم:</span>
                            <div className="text-right">
                              {office.previousPricePerDay && office.previousPricePerDay > office.pricePerDay ? (
                                <div>
                                  <span className="text-gray-400 line-through text-xs">{office.previousPricePerDay}</span>
                                  <span className="text-red-600 font-bold mr-1">{office.pricePerDay}</span>
                                </div>
                              ) : (
                                <span className="text-gray-900">{office.pricePerDay}</span>
                              )}
                              <span className="text-gray-500"> ريال</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">شهر:</span>
                            <div className="text-right">
                              {office.previousPricePerMonth && office.previousPricePerMonth > office.pricePerMonth ? (
                                <div>
                                  <span className="text-gray-400 line-through text-xs">{office.previousPricePerMonth}</span>
                                  <span className="text-red-600 font-bold mr-1">{office.pricePerMonth}</span>
                                </div>
                              ) : (
                                <span className="text-gray-900">{office.pricePerMonth}</span>
                              )}
                              <span className="text-gray-500"> ريال</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {(() => {
                          // حساب الخصومات من الأسعار السابقة (نفس المنطق المستخدم في العميل)
                          const calculateDiscount = (previousPrice: number | null | undefined, currentPrice: number): number => {
                            if (previousPrice && previousPrice > 0 && currentPrice > 0 && previousPrice > currentPrice) {
                              return Math.round(((previousPrice - currentPrice) / previousPrice) * 100)
                            }
                            return 0
                          }

                          const hourlyDiscount = calculateDiscount(office.previousPricePerHour, office.pricePerHour)
                          const dailyDiscount = calculateDiscount(office.previousPricePerDay, office.pricePerDay)
                          const monthlyDiscount = calculateDiscount(office.previousPricePerMonth, office.pricePerMonth)

                          const maxDiscount = Math.max(hourlyDiscount, dailyDiscount, monthlyDiscount)

                          if (maxDiscount > 0) {
                            return (
                              <div className="space-y-1">
                                <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                  🔥 حتى {maxDiscount}%
                                </span>
                                <div className="text-xs space-y-0.5">
                                  {hourlyDiscount > 0 && (
                                    <div className="flex justify-between items-center bg-red-50 px-2 py-1 rounded">
                                      <span className="text-gray-600">ساعة:</span>
                                      <span className="text-red-600 font-bold">{hourlyDiscount}%</span>
                                    </div>
                                  )}
                                  {dailyDiscount > 0 && (
                                    <div className="flex justify-between items-center bg-red-50 px-2 py-1 rounded">
                                      <span className="text-gray-600">يوم:</span>
                                      <span className="text-red-600 font-bold">{dailyDiscount}%</span>
                                    </div>
                                  )}
                                  {monthlyDiscount > 0 && (
                                    <div className="flex justify-between items-center bg-red-50 px-2 py-1 rounded">
                                      <span className="text-gray-600">شهر:</span>
                                      <span className="text-red-600 font-bold">{monthlyDiscount}%</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          } else {
                            return (
                              <div className="text-center">
                                <span className="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded">لا يوجد خصم</span>
                                <div className="text-xs text-gray-400 mt-1">أضف أسعار سابقة للخصم</div>
                              </div>
                            )
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          office.isAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {office.isAvailable ? 'متاح ✅' : 'غير متاح ❌'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <button
                          onClick={() => {
                            setEditingOffice(office)
                            setShowOfficeForm(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 ml-4"
                        >
                          تعديل ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteOffice(office.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          حذف 🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">إدارة المكافآت 🎁</h2>
              <button
                onClick={() => setShowRewardForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                إضافة مكافأة جديدة ➕
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اسم المكافأة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النقاط المطلوبة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rewards.map((reward) => (
                    <tr key={reward.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{reward.name}</div>
                          <div className="text-sm text-gray-500">{reward.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {reward.pointsCost} نقطة
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reward.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {reward.isActive ? 'نشط ✅' : 'غير نشط ❌'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <button
                          onClick={() => {
                            setEditingReward(reward)
                            setShowRewardForm(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 ml-4"
                        >
                          تعديل ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteReward(reward.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          حذف 🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Points Configuration Tab */}
        {activeTab === 'points' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">إدارة النقاط ⚙️</h2>
              <p className="text-sm text-gray-600">تحكم في النقاط التي يحصل عليها العملاء عند الحجز والتجديد</p>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نوع الإجراء
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الوصف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النقاط
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pointsConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {config.action.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{config.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-blue-600">{config.points} نقطة</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          config.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {config.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setEditingPointsConfig(config)}
                          className="text-blue-600 hover:text-blue-900 ml-4"
                        >
                          تعديل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">إدارة العملاء 👥</h2>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الاسم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم الهاتف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نقاط الولاء
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحجوزات
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الاشتراكات
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحجز الحالي
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ التسجيل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        لا توجد عملاء مسجلين حتى الآن
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {client.username || 'غير محدد'}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {client.id.slice(-8)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          <div className="flex items-center">
                            <span className="text-gray-900">{client.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            💎 {client.loyaltyPoints} نقطة
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            📅 {client._count.bookings}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                            📋 {client._count.subscriptions}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {client._count.bookings > 0 ? (
                            <div className="text-sm">
                              <div className="flex items-center">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                  🏢 يوجد {client._count.bookings} حجز
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                📅 تحتاج تفعيل عرض التفاصيل
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              لا يوجد حجز نشط
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            client.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {client.isActive ? '✅ نشط' : '❌ غير نشط'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          <div>
                            <div>{new Date(client.createdAt).toLocaleDateString('ar-SA')}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(client.createdAt).toLocaleTimeString('ar-SA', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                          <button
                            onClick={() => {
                              setEditingClient(client)
                              setShowClientPointsModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 ml-4"
                          >
                            تعديل النقاط 💎
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">إدارة الاشتراكات 📋</h2>
              <button
                onClick={() => setShowSubscriptionForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                إضافة اشتراك جديد ➕
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المكتب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نوع الباقة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ البداية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ النهاية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        لا توجد اشتراكات حتى الآن
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((subscription) => (
                      <tr key={subscription.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {subscription.user.username || 'غير محدد'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {subscription.user.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                🏢 {subscription.office.officeNumber || subscription.office.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                سعة: {subscription.office.capacity}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                            {subscription.duration === 'HOURLY' ? '⏰ ساعة' :
                             subscription.duration === 'DAILY' ? '🗓️ يوم' :
                             subscription.duration === 'MONTHLY' ? '📆 شهر' : subscription.duration}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {new Date(subscription.startDate).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {new Date(subscription.endDate).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            subscription.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : subscription.status === 'EXPIRED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {subscription.status === 'ACTIVE' ? '✅ نشط' :
                             subscription.status === 'EXPIRED' ? '❌ منتهي' :
                             subscription.status === 'CANCELLED' ? '🚫 ملغي' : subscription.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                          <button
                            onClick={() => {
                              setEditingSubscription(subscription)
                              setShowSubscriptionForm(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 ml-4"
                          >
                            تعديل ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteSubscription(subscription.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            حذف 🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Office Form Modal */}
        <OfficeFormModal
          isOpen={showOfficeForm}
          onClose={() => {
            setShowOfficeForm(false)
            setEditingOffice(null)
          }}
          onSave={handleSaveOffice}
          editingOffice={editingOffice}
        />

        {/* Reward Form Modal */}
        <RewardFormModal
          isOpen={showRewardForm}
          onClose={() => {
            setShowRewardForm(false)
            setEditingReward(null)
          }}
          onSave={handleSaveReward}
          editingReward={editingReward}
        />

        {/* Client Points Modal */}
        <ClientPointsModal
          isOpen={showClientPointsModal}
          onClose={() => {
            setShowClientPointsModal(false)
            setEditingClient(null)
          }}
          onSave={handleUpdateClientPoints}
          client={editingClient}
        />

        {/* Subscription Form Modal */}
        <SubscriptionFormModal
          isOpen={showSubscriptionForm}
          onClose={() => {
            setShowSubscriptionForm(false)
            setEditingSubscription(null)
          }}
          onSave={handleSaveSubscription}
          editingSubscription={editingSubscription}
          clients={clients}
          offices={offices}
        />

        {/* Points Configuration Modal */}
        <PointsConfigModal
          isOpen={!!editingPointsConfig}
          onClose={() => setEditingPointsConfig(null)}
          onSave={handleUpdatePointsConfig}
          config={editingPointsConfig}
        />
      </div>
    </div>
  )
}

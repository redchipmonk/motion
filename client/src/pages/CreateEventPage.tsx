/**
 * @file Event creation and editing page.
 * 
 * Dual-mode form that handles both creating new events and editing existing ones.
 * Uses react-hook-form with Zod validation. Supports header/gallery images,
 * location autocomplete, tags, and visibility settings.
 * 
 * @example
 * // Create mode: /events/create
 * // Edit mode: /events/:id/edit
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { api } from '../lib/api';
import { VISIBILITY_OPTIONS } from '../constants';
import LocationAutocomplete from '../components/LocationAutocomplete';
import ImagePicker from '../components/ImagePicker';
import TagInput from '../components/TagInput';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GoChevronDown, GoCheck } from 'react-icons/go';
import { useAuth } from '../context/AuthContext';

// Schema Definition
const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),

  // Splitting Date/Time for UI ease
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),

  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  location: z.object({
    address: z.string().min(1, 'Address is required'),
    coordinates: z.array(z.number()).length(2, 'Invalid coordinates'),
  }),
  tags: z.array(z.string()),
  status: z.enum(["published", "draft"]),
  visibility: z.enum(["public", "mutuals", "followers", "friends", "private"]),
  hideLocation: z.boolean(),
})

type EventFormValues = z.infer<typeof eventSchema>

const CreateEventPage = () => {
  const navigate = useNavigate()
  const { id } = useParams() // Get ID from URL for Edit Mode
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(id) // Flag for Edit Mode

  // Component State
  const [tags, setTags] = useState<string[]>([])
  const [headerImage, setHeaderImage] = useState<File[]>([])
  const [galleryImages, setGalleryImages] = useState<File[]>([])
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false)



  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      tags: [],
      status: "published",
      visibility: "public",
      hideLocation: false,
      location: { address: '', coordinates: [] },
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
    }
  })

  // Fetch Event Data if in Edit Mode
  useEffect(() => {
    if (isEditing && id) {
      const fetchEvent = async () => {
        try {
          // Use mock data for now - in production, use API
          const { getEventById } = await import('../data/mockData')
          const event = getEventById(id)

          if (!event) {
            setError("Event not found.")
            return
          }

          // Parse Date
          const dateObj = new Date(event.dateTime)
          const dateStr = dateObj.toISOString().split('T')[0]
          const timeStr = dateObj.toTimeString().slice(0, 5) // HH:MM

          let endTimeStr = ''
          // Since mock data doesn't have endDateTime, skip this
          // if (event.endDateTime) {
          //   endTimeStr = new Date(event.endDateTime).toTimeString().slice(0, 5)
          // }

          setTags(event.tags || [])

          reset({
            title: event.title,
            description: event.description,
            date: dateStr,
            startTime: timeStr,
            endTime: endTimeStr,
            location: {
              address: event.location.address || '',
              coordinates: event.location.coordinates
            },
            status: event.status || 'published',
            visibility: 'public', // Default since mock data doesn't have this
            hideLocation: false, // Default since mock data doesn't have this
            capacity: undefined, // Mock data doesn't have capacity
            tags: event.tags || [],
          })
        } catch (err) {
          console.error("Failed to fetch event", err)
          setError("Failed to load event details.")
        }
      }
      fetchEvent()
    }
  }, [isEditing, id, reset])

  // Watch for controlled inputs
  const hideLocation = watch('hideLocation');
  const currentVisibility = watch('visibility');
  const watchedTitle = watch('title');

  const onSubmit = async (data: EventFormValues) => {
    try {
      setError(null)

      // Combine Date + Time
      const startDateTime = new Date(`${data.date}T${data.startTime}`)
      if (isNaN(startDateTime.getTime())) {
        setError("Invalid Start Date/Time")
        return
      }

      let endDateTime: Date | undefined
      if (data.endTime) {
        endDateTime = new Date(`${data.date}T${data.endTime}`)
        if (endDateTime <= startDateTime) {
          setError("End time must be after start time")
          return
        }
      }

      const payload = {
        ...data,
        dateTime: startDateTime.toISOString(),
        endDateTime: endDateTime?.toISOString(),
        location: {
          address: data.location.address,
          longitude: data.location.coordinates[0],
          latitude: data.location.coordinates[1],
        },
        tags,
      }

      if (isEditing) {
        await api.patch(`/events/${id}`, payload)
      } else {
        await api.post('/events', payload)
      }

      navigate('/')
    } catch (err: unknown) {
      console.error(err)
      setError(isEditing ? 'Failed to update event.' : 'Failed to create event. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.delete(`/events/${id}`)
        navigate('/')
      } catch (err) {
        console.error(err)
        setError("Failed to delete event.")
      }
    }
  }

  const handleLocationSelect = (address: string, lat: number, lon: number) => {
    setValue('location', {
      address: address,
      coordinates: [lon, lat],
    })
  }

  return (
    <div className="mx-auto w-full px-12 py-12 pb-20 overflow-y-auto h-full">
      <div className="mx-auto max-w-8xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-5xl font-bold text-motion-plum">
            {isEditing ? (
              <>Edit <span className="text-motion-purple">{watchedTitle || 'Event'}</span> for <span className="text-motion-purple">{user?.name || 'User'}</span></>
            ) : (
              <>Create Event for <span className="text-motion-purple">{user?.name || 'User'}</span></>
            )}
          </h1>
          {isEditing && id && (
            <button
              type="button"
              onClick={() => navigate(`/events/${id}`)}
              className="shrink-0 rounded-2xl border-2 border-transparent bg-motion-lilac px-6 py-2 text-lg font-bold text-motion-purple transition-colors duration-200 hover:border-motion-purple active:bg-motion-purple active:text-white"
            >
              View Event
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* Header Image Picker */}
          <div className="mb-12 space-y-4">
            <label className="text-xl font-semibold text-black">Select Header Image</label>
            <div className="w-full">
              <ImagePicker
                images={headerImage}
                onChange={setHeaderImage}
                multiple={false}
                className="w-full object-cover"
                withDecoration
              />
            </div>
          </div>

          {/* Grid Layout: 3/4 Main, 1/4 Sidebar */}
          <div className="grid grid-cols-[3fr_1fr] gap-12">

            {/* Main Column */}
            <div className="space-y-8">

              {/* Event Name */}
              <div className="space-y-2">
                <label className="font-semibold text-xl">Event Name</label>
                <input
                  {...register('title')}
                  className="w-full rounded-sm border border-transparent bg-white p-4 text-lg text-black placeholder-black/50 outline-none transition focus:placeholder-transparent focus:shadow-[0_0_0_2px_#5F0589]"
                  placeholder="e.g. Bake Sale"
                />
                {errors.title && <p className="text-red-500">{errors.title.message}</p>}
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-xl flex items-center gap-2 flex-wrap">
                    Time <span className="text-gray-400 font-normal text-sm whitespace-nowrap">(End time optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      {...register('startTime')}
                      className="w-full rounded-sm border border-transparent bg-white p-4 text-black outline-none transition focus:shadow-[0_0_0_2px_#5F0589]"
                    />
                    <span className="self-center">-</span>
                    <input
                      type="time"
                      {...register('endTime')}
                      className="w-full rounded-sm border border-transparent bg-white p-4 text-black outline-none transition focus:shadow-[0_0_0_2px_#5F0589]"
                    />
                  </div>
                  {errors.startTime && <p className="text-red-500">{errors.startTime.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-xl">Date</label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full rounded-sm border border-transparent bg-white p-4 text-black outline-none transition focus:shadow-[0_0_0_2px_#5F0589]"
                  />
                  {errors.date && <p className="text-red-500">{errors.date.message}</p>}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <div className="flex justify-between items-center flex-wrap">
                  <label className="font-semibold text-xl">Address</label>
                  <div className="flex items-center gap-2">
                    <label htmlFor="hideLocation" className="text-sm text-gray-600 cursor-pointer select-none">
                      Show exact location
                    </label>
                    <input
                      id="hideLocation"
                      type="checkbox"
                      className="accent-motion-purple h-4 w-4 cursor-pointer"
                      checked={!hideLocation} // Controlled input: if hideLocation is true (Hide), Checked is false (Don't Show).
                      onChange={(e) => setValue('hideLocation', !e.target.checked)} // Checked = Show (hide=false)
                    />
                  </div>
                </div>
                <LocationAutocomplete onSelect={handleLocationSelect} />
                {errors.location?.address && <p className="text-red-500">Address is required</p>}
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="font-semibold text-xl">Add Tags</label>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="rounded-full bg-motion-lilac px-3 py-1 text-sm text-motion-purple hover:bg-motion-lilac/80 transition-colors"
                    >
                      {tag} ✕
                    </button>
                  ))}
                </div>
                <TagInput tags={tags} onChange={setTags} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="font-semibold text-xl">Description</label>
                <textarea
                  {...register('description')}
                  rows={15}
                  className="w-full rounded-sm border border-transparent bg-white p-4 text-black placeholder-black/50 outline-none resize-none transition focus:placeholder-transparent focus:shadow-[0_0_0_2px_#5F0589]"
                  placeholder="Treat yourself to a variety of homemade baked goods..."
                />
                {errors.description && <p className="text-red-500">{errors.description.message}</p>}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-8 pt-2">
                {isEditing ? (
                  // Edit Mode Buttons
                  <>
                    <button
                      type="submit" // Save updates
                      disabled={isSubmitting}
                      className="flex-1 rounded-2xl border-2 border-transparent bg-motion-yellow px-8 py-2 text-2xl font-bold text-motion-plum transition-colors duration-200 hover:border-motion-plum active:bg-motion-orange active:text-white active:border-motion-orange"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Event'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="flex-1 rounded-2xl border-2 border-transparent bg-motion-purple px-8 py-2 text-2xl font-bold text-white transition-colors duration-200 hover:border-motion-orange active:bg-motion-orange active:border-motion-orange"
                    >
                      Delete Event
                    </button>
                  </>
                ) : (
                  // Create Mode Buttons
                  <>
                    <button
                      type="submit"
                      onClick={() => setValue('status', 'published')}
                      disabled={isSubmitting}
                      className="flex-1 rounded-2xl border-2 border-transparent bg-motion-purple px-8 py-2 text-2xl font-bold text-white transition-colors duration-200 hover:border-motion-orange active:bg-motion-orange active:border-motion-orange"
                    >
                      {isSubmitting ? 'Publishing...' : 'Publish Event'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('status', 'draft')
                        handleSubmit(onSubmit)()
                      }}
                      disabled={isSubmitting}
                      className="flex-1 rounded-2xl border-2 border-transparent bg-motion-yellow px-8 py-2 text-2xl font-bold text-motion-plum transition-colors duration-200 hover:border-motion-plum active:bg-motion-orange active:text-white active:border-motion-orange"
                    >
                      Save to Drafts
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Photo Gallery */}
              <div className="space-y-2">
                <label className="font-semibold text-xl">Add Photo(s)</label>
                <ImagePicker
                  images={galleryImages}
                  onChange={setGalleryImages}
                  multiple
                  mode="stack"
                  className="w-full"
                />
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <label className="font-semibold text-xl">Visibility</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsVisibilityOpen(!isVisibilityOpen)}
                    // No shadow, mimicking input style
                    className="flex w-full items-center justify-between rounded-sm bg-white p-4 text-left text-black outline-none border border-transparent transition-all focus:shadow-[0_0_0_2px_#5F0589]"
                  >
                    <span>{VISIBILITY_OPTIONS.find(opt => opt.value === currentVisibility)?.label || currentVisibility}</span>
                    <GoChevronDown className={`text-xl transition-transform ${isVisibilityOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isVisibilityOpen && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        {VISIBILITY_OPTIONS.map((opt, idx) => (
                          <button
                            key={`${opt.label}-${idx}`}
                            type="button"
                            onClick={() => {
                              setValue('visibility', opt.value as "public" | "mutuals" | "followers" | "friends" | "private");
                              setIsVisibilityOpen(false);
                            }}
                            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-motion-lilac hover:text-motion-purple transition-colors"
                          >
                            {opt.label}
                            {currentVisibility === opt.value && (
                              <GoCheck className="text-motion-purple" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hidden backdrop to close */}
                  {isVisibilityOpen && (
                    <div className="fixed inset-0 z-0" onClick={() => setIsVisibilityOpen(false)} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Global Error */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default CreateEventPage
